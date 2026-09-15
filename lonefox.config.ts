import type { Tone } from 'lonefox/config';

export const site = {
  name: 'hare',
  wordmark: 'hare',
  motto: 'still lost, still going.',
  description: 'a quiet den on the web — systems, domains, places & words, kept by one still lost, still going.',
  url: 'https://hareai.dev',
  lang: 'en',
  author: 'Lee Robin',
  email: 'hareai@outlook.com',
  github: 'https://github.com/hareai',
  ogImage: '/images/share.png',
  favicon: '/favicon.png',
  themeKey: 'hare-theme',
  rssTitle: 'hare — still going',
  years: '2016~2026',
};

export const nav = [
  { href: '/', label: 'home' },
  { href: '/study/', label: 'study' },
  { href: '/scraps/', label: 'scraps' },
  { href: '/about/', label: 'about' },
  { href: '/rss.xml', label: 'rss' },
];

export const home = {
  door: 'you found the den — come in, the fire is low.',
  hearth: {
    motto: 'still lost, still going.',
    soft: 'i collect small things: systems, domains, words, a song or two that stayed. go by day, poems by night. slow is fine; stopped is not.',
    stamp: '— still going · ',
  },
  identity: {
    rows: [
      { mark: '◆', text: 'one, at this desk' },
      { mark: '±', text: 'writing go since 2017' },
      { mark: '≈', text: 'walks, rain, poems' },
    ],
    note: 'hare · 51°N, ish',
  },
  portrait: { src: '/images/head.jpg', alt: 'the keeper' },
  themes: {
    label: 'kept nearby',
    tags: [
      { name: 'systems', tone: 'ember' as Tone, ico: '⌗' },
      { name: 'go', tone: 'glow' as Tone, ico: '⌘' },
      { name: 'domains', tone: 'indigo' as Tone, ico: '⊙' },
      { name: 'night walks', tone: 'glow' as Tone, ico: '⌖' },
      { name: 'rain', tone: 'indigo' as Tone, ico: '≈' },
      { name: 'words', tone: 'ember' as Tone, ico: '§' },
      { name: 'slow builds', tone: 'glow' as Tone, ico: '∿' },
    ],
  },
  shelf: {
    label: 'on the shelves',
    hint: 'things kept close',
    items: [
      { text: 'systems & quiet tools', mark: '♡' },
      { text: 'domains finding dens', mark: '❁' },
      { text: 'rain, parks, streets still unwalked', mark: '⌁' },
      { text: 'the poem inside the work', mark: '✎' },
    ],
  },
  corner: {
    label: 'in the corner',
    hint: 'still taking shape',
    items: [
      { text: 'this den, slowly', mark: '▲' },
      { text: 'small bots & architectures', mark: '◍' },
      { text: 'a better self, still becoming', mark: '∅' },
    ],
    note: '+ a few corners still empty',
  },
  rooms: {
    label: 'sounds from other rooms',
    bots: [
      { name: 'evie', status: 'keeping the ledgers in the study' },
      { name: 'ann', status: 'chasing something shiny under the couch' },
    ],
  },
  table: { label: 'on the table', hint: 'recently brought home' },
  study: { label: 'the study', note: 'everything filed so far' },
};

export const about = {
  meta: 'about this den',
  headline: 'who lives here',
  accent: 'here',
  lede: 'go by day, poems by night. technical notes, travel stories and poems keep meeting in this room.',
  ledeSoft: "you've caught me between pages. the kettle's by the fire, the study's down the hall. take your shoes off, stay as long as you like.",
  quote: 'what stays on the desk becomes the song later.',
  photo: {
    src: '/images/about-portrait.jpg',
    alt: 'a monochrome portrait — ink-black hair, a lit cigarette, eyes level with the reader',
  },
  skills: [
    { label: 'backend', tone: 'ember' as Tone, tags: ['golang', 'php', 'python', 'node'] },
    { label: 'frontend', tone: 'indigo' as Tone, tags: ['react', 'typescript', 'astro', 'tailwind'] },
    { label: 'infrastructure', tone: 'glow' as Tone, tags: ['kubernetes', 'docker', 'nginx', 'postgres', 'redis', 'ci/cd'] },
  ],
};

export const archive = {
  meta: 'the study / archive',
  headline: 'everything filed so far',
  accent: 'filed',
  lede: 'the workbench. systems and tooling.',
  photo: {
    src: '/images/study-portrait.jpg',
    alt: 'a girl peeking into the study, a question mark over her head',
  },
  drawers: [
    { key: 'tech', shelf: 'the workbench shelf', hint: 'systems & tooling', mark: '◇' },
  ],
};

export const scraps = {
  meta: 'scraps',
  headline: 'the rest of the paper',
  accent: 'rest',
  lede: 'poems, walks, and notes that are not tooling.',
  photo: {
    src: '/images/scraps-portrait.jpg',
    alt: 'a girl with headphones, a cassette deck behind her',
  },
  drawers: [
    { key: 'notes', shelf: 'the paper', hint: 'notes that stayed', mark: '♡' },
    { key: 'poem', shelf: 'the poems', hint: 'lines that stayed', mark: '✎' },
    { key: 'travel', shelf: 'the maps', hint: 'gone somewhere', mark: '⌖' },
  ],
};

export const notFound = {
  meta: '404 / nothing here',
  headline: 'this path is empty',
  lede: 'the page may have moved into the study, or it was never written.',
};

export function withAccent(text: string, accent?: string) {
  if (!accent || !text.includes(accent)) return { before: text, accent: '', after: '' };
  const i = text.indexOf(accent);
  return { before: text.slice(0, i), accent, after: text.slice(i + accent.length) };
}
