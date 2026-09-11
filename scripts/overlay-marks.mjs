import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const destDir = join(root, 'node_modules', 'lonefox', 'src', 'components');
const overlayDir = join(root, 'overlays');

const files = ['FoxMark.astro', 'SleepingFox.astro', 'PawTrail.astro'];

if (!existsSync(destDir)) {
  console.error('overlay-marks: lonefox components missing — run npm install first');
  process.exit(1);
}

for (const name of files) {
  const src = join(overlayDir, name);
  const dest = join(destDir, name);
  if (!existsSync(src)) {
    console.error('overlay-marks: missing', src);
    process.exit(1);
  }
  copyFileSync(src, dest);
  console.log('overlay', name);
}
