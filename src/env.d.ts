/// <reference types="astro/client" />

declare module 'lonefox' {
  import type { AstroIntegration } from 'astro';
  export function lonefoxSrc(root?: string): string;
  export default function lonefox(): AstroIntegration;
}

declare module 'lonefox/config' {
  export type Tone = 'ember' | 'indigo' | 'glow';
  export const site: {
    name: string;
    wordmark: string;
    motto: string;
    description: string;
    url: string;
    lang: string;
    author: string;
    email: string;
    github: string;
    ogImage: string;
    favicon: string;
    themeKey: string;
    rssTitle: string;
    years?: string;
  };
  export const nav: { href: string; label: string }[];
  export const home: {
    door: string;
    hearth: { motto: string; soft: string; stamp: string };
    identity: { rows: { mark: string; text: string }[]; note: string };
    portrait: { src: string; alt: string };
    themes: { label: string; tags: { name: string; tone: Tone; ico: string }[] };
    shelf: { label: string; hint: string; items: { text: string; mark: string }[] };
    corner: { label: string; hint: string; items: { text: string; mark: string }[]; note: string };
    rooms: { label: string; bots: { name: string; status: string }[] };
    table: { label: string; hint: string };
    study: { label: string; note: string };
  };
  export const about: {
    meta: string;
    headline: string;
    accent: string;
    lede: string;
    ledeSoft: string;
    quote: string;
    photo: { src: string; alt: string };
    skills: { label: string; tone: Tone; tags: string[] }[];
  };
  export const archive: {
    meta: string;
    headline: string;
    accent: string;
    lede: string;
    photo: { src: string; alt: string };
    drawers: { key: string; shelf: string; hint: string; mark: string }[];
  };
  export const scraps: {
    meta: string;
    headline: string;
    accent: string;
    lede: string;
    photo: { src: string; alt: string };
    drawers: { key: string; shelf: string; hint: string; mark: string }[];
  };
  export const notFound: { meta: string; headline: string; lede: string };
  export function withAccent(text: string, accent?: string): { before: string; accent: string; after: string };
}
