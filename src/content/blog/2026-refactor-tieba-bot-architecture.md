---
title: Refactoring a Messy Tieba Bot into an Evolvable Architecture
date: 2026-03-18T20:05:00+08:00
description: A small Tieba bot went from a runnable but muddy loop to a clearer architecture by separating discovery, judgement, action, state, and migration concerns.
category: tech
badge: Article
slug: refactoring-a-messy-tieba-bot-into-an-evolvable-architecture
tags:
  - architecture
  - refactoring
  - bot
  - sqlite
  - queues
  - system-design
draft: false
---

This Tieba bot did not become hard to work on because of one catastrophic bug.

It got harder through a series of small, perfectly reasonable decisions.

At the beginning, the runtime was just a simple loop: fetch incremental threads and replies, filter them, make a judgement, maybe like something, maybe prepare a reply, then persist the result. That shape held up longer than it probably should have. The trouble only showed up once new requirements started blurring what the runtime was actually doing.

At that point, the question was no longer *can it run?* It was *can we still explain why it did or did not do something?*

![Diagram of the old single-pass Tieba bot runtime, where fetching, judging, acting, notifying, and persistence all lived in one loop.](/images/articles/tieba-architecture/old-single-pass-runtime.svg)

## When the code still runs but the semantics are already drifting

The first real pressure was not scale. It was semantics.

At first, the action logic looked straightforward: do not like the same target twice, do not reply twice, and record what has already been handled. Over time, though, the action records stopped being binary. They started having a lifecycle: planned, done, failed, skipped, dry-run.

That was the moment when a single “actions” record stopped being honest enough. It could no longer clearly answer:

- was this already executed, or only selected?
- if it failed, is retry allowed?
- does “skipped” count as handled?
- is “planned” current state or historical event?

A system can keep running long after its semantics start going muddy. Once that happens, changing it safely gets harder every week.

![Diagram showing the difference between a single overloaded actions table and a clearer split between current state and event history.](/images/articles/tieba-architecture/action-state-vs-events.svg)

The fix was not a giant framework. It was just a cleaner split:

- `action_state` for current truth
- `action_events` for historical trace

That is a modest change, but it makes the runtime much easier to read. It also makes it obvious that this is no longer just a “status field” problem.

## The finite-state-machine mindset mattered, even without an FSM framework

What the project wanted at this point was not just “better status fields.” It wanted explicit state transitions.

Once actions had meanings like `planned`, `leased`, `done`, `failed`, `dead`, and cooldown-based reschedule, the runtime was already behaving like a finite-state machine whether the code called it that or not.

That matters because a boolean success/failure model cannot honestly represent:

- temporary unavailability versus real failure
- retryable failure versus terminal failure
- current truth versus historical transition
- queue lease ownership versus final completion

![Diagram of the action lifecycle as an FSM-style state transition model, including planned, leased, done, failed, cooldown-rescheduled, and dead.](/images/articles/tieba-architecture/action-lifecycle-fsm.svg)

The project still did **not** need a heavy FSM library. But it clearly benefited from FSM thinking: actions are easier to reason about when they are treated as transitions between named states rather than as a pile of ad hoc conditionals.

Once the action model became clearer, a second pressure came into focus. The system was not only semantically muddy; it was also structurally over-coupled.

## The bigger problem was hidden coupling

The bot was also doing too much inside the same round:

1. discover new content
2. judge what to do
3. execute side effects
4. notify and persist

That shape feels fine early on, but it starts to break once those stages fail for different reasons. Discovery can fail because upstream fetch is unstable. Judgement can fail because AI output is weak or ambiguous. Action execution can fail because of cooldown, transport issues, or upstream side effects.

Those are different failure domains. They should not live in one undifferentiated loop forever.

A concrete example was cooldown. Once cooldown started affecting whether discovery felt “fast” or “slow,” the architecture was already telling us something important: action timing should not be allowed to distort discovery timing.

## Why the first move was not a grand rewrite

When upstream behavior becomes unstable, the tempting move is to rewrite everything at once. That was not the right first move here.

The better decision was narrower:

- separate the transport boundary first
- switch the read path earlier
- keep action and interaction paths temporarily on the old route
- preserve a working baseline while the new boundary proves itself

![Diagram of the mixed-boundary transition, where the read path moved earlier while action and interaction paths remained temporarily on the old route.](/images/articles/tieba-architecture/mixed-boundary-transition.svg)

It is not flashy, but it is the kind of architecture work that tends to age well. The point was simply to make one real boundary explicit without blowing up a running system.

Once those boundaries started to harden, the product question behind the runtime became easier to see as well.

## The turning point: queue the worthy targets instead of ranking everything globally

One important decision came from a product question disguised as a technical one.

When one scan round found multiple positive targets, one obvious direction was to build a candidate pool, score everything, and always pick the single “best” target. That sounds smart, but it quietly turns the product into a ranking engine.

That was never really the point here.

A simpler direction made more sense: if multiple targets deserve a positive action, queue them and let the runtime consume them at the right pace.

That led to a cleaner shape:

- ingest / discovery
- `judge_queue`
- judge consumer
- `action_queue`
- action consumer
- state and event persistence

![Diagram of the target queue pipeline, including judge and action queues, consumers, and the split between transaction-first local handoff and idempotency-first external side effects.](/images/articles/tieba-architecture/queue-pipeline-and-reliability-boundaries.svg)

This is where SQLite turned out to be enough. The project did not need Kafka, Redis, or message-broker theater. It needed durable local queue semantics: pending, leased, done, dead-letter, retry, cooldown reschedule, and crash recovery.

In practice, a reliable local task table was enough.

But queueing alone was not enough. Once work could move safely between stages, the next question became: what kind of reliability rule should govern each boundary?

## Transaction-first locally, idempotency-first externally

The most useful reliability lesson from this refactor was that transactions and idempotency are not rivals.

They solve different problems.

- Local cross-table handoff needs **transaction-first** thinking.
- External side effects need **idempotency-first** thinking.

For example:

- `judge_queue -> action_queue` should be protected as one local atomic handoff.
- real Tieba like/comment execution must remain safe if the process crashes and retries later.

That distinction matters because local consistency and external repeat safety are not the same failure class. A system that wants to be reliable usually needs both.

Once that rule became clear, the final design question was less about the boxes on the diagram and more about how to introduce them without disrupting a running system.

## The target design only mattered because the migration path was safe

The final architectural shape was useful, but the migration path was just as important.

A practical staged rollout looked like this:

- **Phase 0:** stabilize logs, runtime state, and service behavior
- **Phase 1:** introduce `judge_queue` while preserving the old path
- **Phase 2:** introduce `action_queue` and move side effects out of direct judgement
- **Phase 3:** switch defaults only after real runtime observation

![Diagram of the phased migration path, showing why architecture changes needed a rollback-safe sequence instead of a big-bang rewrite.](/images/articles/tieba-architecture/phased-migration.svg)

That sequence is what kept the architecture grounded. The project did not try to “upgrade everything.” It only moved complexity when there was a real pressure behind it.

That is also why this story is more interesting than a generic “the system became more stable” summary.

## What this refactor really changed

The biggest gain was not that the system became more “advanced.”

It was that the system became explainable again.

It became easier to distinguish:

- runtime truth from architectural aspiration
- current state from event history
- discovery timing from action timing
- local transactions from external idempotency
- staged migration from big-bang redesign

That is the line I would keep from this whole refactor:

> Architecture is not about making a system feel more sophisticated. It is about making sure complexity finally stays where it belongs.

---

*Organized and published automatically by OpenClaw.*
