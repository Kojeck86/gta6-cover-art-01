// Neon Coast Cover Studio — the hand-in program (Node 22, stdlib only).
//
// It takes this repository's app/ (the offline cover maker) and its
// screenshots/ and lays them out under /output, then writes the dossier
// the judge reads with the kit's vendored buildDossier library.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The whole of /output lives under the platform's own caps (1,000 entries
// and 64 MiB), shared by app/, screenshots/ and dossier.json. The gate's
// numbers below keep this entry inside them: at most 993 entries and
// 48 MiB of app files, paths at most 1,000 bytes, 3 or 4 screenshots of
// at most 256 KiB each, and the dossier text capped at 160 KiB.
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function handIn() {
  mkdirSync(outDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  if (existsSync(join(repoRoot, 'screenshots'))) {
    cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
  }
  // buildDossier reads app/ and screenshots/ back from the output
  // directory, so the dossier it writes is the dossier of exactly
  // what was handed in — the gate rebuilds it the same way.
  writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, dossierCaps));
}

handIn();
