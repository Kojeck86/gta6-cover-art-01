# Neon Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Kojeck86/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Kojeck86/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline browser web app that turns any photo into GTA-style cover art — the multi-panel poster look with bold caption lettering and a Vice City neon-sunset grade — and exports it as a PNG to share. Built for the make.fun bounty [gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- **Any photo:** load photos from your machine (or use the three built-in illustrated scenes). Each panel takes its own photo, or one photo fills them all. Click a panel to select it, drag to move the photo, scroll to zoom.
- **Five layouts:** Quad (2×2), Hero + Trio, Full Bleed, Tilted Snapshots, Strip.
- **Five grades:** Sunset, Neon Nights, Vice Gold, Golden Hour, Noir — gradient-map colour grades applied per panel, plus film grain and a vignette, with white panel frames.
- **Caption:** a big Anton title with a sunset-gradient fill and a Pacifico neon subtitle, editable text, size and colour.
- **Fast and easy:** three clicks from a photo to a PNG in 1080 × 1080, 1080 × 1350 or 1920 × 1080 — or export all three sizes at once. Undo and redo included.
- **Private by design:** everything runs offline in the browser. Photos are read on your machine and never uploaded. No network requests at all.

## Try it

Serve `app/` with any static server and open `app/index.html`, for example:

```sh
python3 -m http.server 8080 --directory app
```

then open http://localhost:8080 in desktop Chrome.

## Files

- `app/` — the app itself: `index.html`, `style.css`, `src/cover.js` (the cover engine: layouts, grades, lettering) and `src/main.js` (the editor).
- `app/samples/` — three sample scenes, illustrations drawn in code with Pillow (`app/make-samples.py`).
- `app/fonts/` — Anton and Pacifico, shipped under the SIL Open Font License.
- `screenshots/` — the app at work and covers it exported.
- `main.ts` — the hand-in program: copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json`.

## Originality

All art and code here is original. The sample scenes are illustrations drawn in code, the lettering uses OFL fonts, and no Rockstar Games logo, artwork or font is used anywhere.

## License

MIT — see [LICENSE](LICENSE).
