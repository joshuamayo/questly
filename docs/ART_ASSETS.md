# Questly Art Asset Checklist

Artwork needed to match the approved V2 mockups (`docs/mockups/`). Until an asset is delivered, the app uses a
themed code-drawn placeholder in its slot; delivered files replace placeholders without code changes.

Mark items `[x]` as they are delivered and wired in.

## Rules for every asset

- **Style:** high-resolution pixel art matching the mockups — 16-bit fantasy RPG, warm torchlight/dusk
  lighting, dark stone + gold palette, crisp pixels (no blur or smoothing).
- **No text in images.** Labels, numbers, and names are rendered in code.
- **No RuneScape material:** no characters, logos (including the "RS" coin), item sprites, or map pieces.
- **Formats:** icons and characters → PNG with transparent background. Banners → PNG or WebP.
- **Resolution:** supply at 2× the listed size where possible.
- **Delivery:** upload in chat; files are renamed and placed under `public/art/` (paths below).

## Character
- [ ] Character bust (head & shoulders) — 256×256, transparent → `public/art/character/bust.png`

## Page banners (~2400×400, left third darker/simpler for title text)
- [ ] Generic castle-at-dusk banner (fallback for any screen) → `public/art/banners/default.webp`
- [ ] Quest Log → `public/art/banners/quest-log.webp`
- [ ] Reward Shop → `public/art/banners/reward-shop.webp`
- [ ] Completed → `public/art/banners/completed.webp`
- [ ] Settings → `public/art/banners/settings.webp`

## Navigation icons (96×96, transparent)
- [ ] Quest Log — scroll → `public/art/nav/quest-log.png`
- [ ] Reward Shop — market stall → `public/art/nav/reward-shop.png`
- [ ] Completed — book → `public/art/nav/completed.png`
- [ ] Settings — gear → `public/art/nav/settings.png`

## Currency & brand (96×96 / 256×256, transparent)
- [ ] GP — coin stack → `public/art/icons/gp.png`
- [ ] Questly emblem (logo mark) — 256×256 → `public/art/brand/emblem.png`

## Optional — reward icons
Reward icons are drawn in code from the pixel sprite set (gamepad, burger, gift, monitor, tent, collection,
shop, star, world, diaries, sword, character). Delivered art for these is not wired yet.
