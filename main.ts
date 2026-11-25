// Sizzle Rush — the hand-in program (Node 22, standard library only).
//
// It copies this repository's game/ and screenshots/ into the output
// directory and writes dossier.json with the vendored make.fun library,
// so the judge can read the game and its screenshots. It writes the same
// bytes on every run: no timestamps, no randomness, just files.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The entry is a playable game: refuse to hand in a repository whose
// game never opens. The judge's first criterion is a complete game.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('game/index.html is missing — the entry is not a playable game');
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the others
// refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files in game/ or 48 MiB of game files in
// all, or a path under game/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Hand-in self-check: the judge's first criterion is a complete game, so
// refuse to finish silently if the output is missing its pieces.
if (!existsSync(join(out, 'game', 'index.html')) || !existsSync(join(out, 'dossier.json'))) {
  throw new Error('hand-in incomplete: game/index.html or dossier.json missing from output');
}
