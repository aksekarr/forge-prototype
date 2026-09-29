# Assets

Manifest of design assets used in this repo. Changing an asset means changing its entry here first.

Earlier assets (creature stages and idle frames, scenes, sword, ghost, scene frame, wordmark, wood backdrop) predate this manifest and are not yet recorded. All creature and scene art is AI-generated (ChatGPT image generation) and is placeholder art for the MVP.

## Tarot — card frame
- Asset: Blank tarot card frame (gold filigree, red gems, vines, midnight-blue/plum enamel), art window keyed to transparent
- Source: AI-generated — ChatGPT image generation, Avi's prompts, 2026-09-28. Master: `Approved Spirit Friends /Tarot/card-frame.png`
- Processing: magenta art window keyed to transparent (pixels with R>170, G<120, B>170 → alpha 0), saved as WebP quality 90, 1024×1536
- Licence: AI-generated; label as AI-generated where honesty rules require
- File: `assets/tarot/card-frame.webp`
- Used in: tarot cards (layout: art at left 92, top 196, 840×840 under the frame; name bar x 97–925, y 72–185; text box x 110–913, y 1051–1419 — all on the 1024×1536 frame)
- Chosen: 2026-09-28

## Tarot — card art, season 1 (12 cards)
- Asset: Art panels for I The Mirror, II The Excuse, III The Liar, IV Tomorrow, V The Stone, VI The Witness, VII The Return, VIII The Calm, IX The Ember, and shinies The Rumble, The Fury, The Ascent
- Source: AI-generated — ChatGPT image generation, Avi's prompts, 2026-09-28 (The Stone regraded to night by Claude). Masters: `Approved Spirit Friends /Tarot/art-<name>.png`
- Processing: resized 1254×1254 → 840×840 (Lanczos), WebP quality 90
- Licence: AI-generated; label as AI-generated where honesty rules require. Placeholder — beyond the MVP, cards use real artists
- File: `assets/tarot/art-<name>.webp`
- Used in: tarot cards (via `assets/tarot/cards.json`)
- Chosen: 2026-09-28

## Tarot — card text and data
- Asset: Names, numerals and final text for season 1, with editions (a card is a concept; each edition has its own art and text)
- Source: Original — written by Avi with Claude, 2026-09-28
- Licence: Avi's own writing
- File: `assets/tarot/cards.json`
- Used in: tarot cards
- Chosen: 2026-09-28

## Fonts
- Asset: IM Fell English (card text, Oath), Pixelify Sans (UI, card name bar)
- Source: Self-hosted from Fontsource — [IM Fell English 5.3.0](https://www.npmjs.com/package/@fontsource/im-fell-english/v/5.3.0), regular and italic 400 latin; [Pixelify Sans 5.2.6](https://www.npmjs.com/package/@fontsource/pixelify-sans/v/5.2.6), normal 400, 500 and 600 latin. WOFF2 files in `assets/fonts/`; shared IM Fell regular file reused for the closing line.
- Licence: SIL Open Font License 1.1 — copies in `assets/fonts/OFL-IM-Fell-English.txt` and `assets/fonts/OFL-Pixelify-Sans.txt`; attribution: none required
- Used in: whole site

## Fonts — tarot closing line (self-hosted)
- Asset: IM Fell English Regular (latin, 400), used as the tarot card's closing line with a browser-synthesised slant (matches the approved mockups; the true italic reads narrower and smaller)
- Source: Self-hosted from Fontsource `@fontsource/im-fell-english` 5.3.0 — `files/im-fell-english-latin-400-normal.woff2`
- Licence: SIL Open Font License 1.1 — copy in `assets/fonts/OFL-IM-Fell-English.txt`; attribution: none required
- File: `assets/fonts/im-fell-english-latin-400-normal.woff2`
- Used in: `tarot.css` (`.tarot-copy em`, font family 'Tarot Fell Roman')
- Chosen: 2026-09-29
