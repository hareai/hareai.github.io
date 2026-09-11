import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import lonefox, { lonefoxSrc } from 'lonefox';
import { site } from './lonefox.config';

export default defineConfig({
  site: site.url,
  srcDir: lonefoxSrc(),
  integrations: [sitemap(), lonefox()],
});
