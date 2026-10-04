# Questly Art Asset Checklist

Artwork needed to match the approved mockups (`docs/mockups/`). Until an asset is delivered, the app uses a
themed code-drawn placeholder in its slot; delivered files replace placeholders without code changes.

Mark items `[x]` as they are delivered and wired in.

## Rules for every asset

- **Style:** high-resolution pixel art matching the mockups — 16-bit fantasy RPG, warm torchlight/dusk
  lighting, dark navy + gold palette, crisp pixels (no blur or smoothing).
- **No text in images.** Labels, numbers, and names are rendered in code. The World map has no location labels.
- **No RuneScape material:** no characters, logos (including the "RS" coin), item sprites, or map pieces.
- **Formats:** icons, sprites, and characters → PNG with transparent background. Scenes and banners → PNG or WebP.
- **Resolution:** supply at 2× the listed size where possible.
- **Delivery:** upload in chat; files are renamed and placed under `public/art/` (paths below).

## Tier 1 — Phase 1 restyle

### Character
- [ ] Full-body character (Joshua) — ~512×768, transparent → `public/art/character/full.png`
- [ ] Character bust (head & shoulders) — 256×256, transparent → `public/art/character/bust.png`
- [ ] Optional: up to 4 more bust variants for the avatar picker → `public/art/character/bust-2.png` … `bust-5.png`

### World
- [ ] World map hero — ~1920×900. Villages, castle, forest, mountains, river, cloaked hero at bottom center
      looking out. **No markers or labels.** → `public/art/world/map.webp`

### Page banners (~2400×400, left third darker/simpler for title text)
- [ ] Generic castle-at-dusk banner (fallback for any screen) → `public/art/banners/default.webp`
- [ ] Quests → `public/art/banners/quests.webp`
- [ ] Questlines → `public/art/banners/questlines.webp`
- [ ] Skills → `public/art/banners/skills.webp`
- [ ] Achievement Diaries → `public/art/banners/achievement-diaries.webp`
- [ ] Combat Achievements → `public/art/banners/combat-achievements.webp`
- [ ] Bosses → `public/art/banners/bosses.webp`
- [ ] Collection Log → `public/art/banners/collection-log.webp`
- [ ] Reward Shop → `public/art/banners/reward-shop.webp`
- [ ] Character → `public/art/banners/character.webp`
- [ ] Settings → `public/art/banners/settings.webp`
- [ ] Focus Mode → `public/art/banners/focus.webp`
- [ ] Weekly Planning → `public/art/banners/weekly-planning.webp`
- [ ] Respawn → `public/art/banners/respawn.webp`

### Skill icons (128×128, transparent)
- [ ] Creator — purple crossed tools / quill → `public/art/skills/creator.png`
- [ ] Business — blue briefcase → `public/art/skills/business.png`
- [ ] Finance — gold coin stack → `public/art/skills/finance.png`
- [ ] Fitness — red/steel dumbbell → `public/art/skills/fitness.png`
- [ ] Home — orange house → `public/art/skills/home.png`
- [ ] Focus — green clover → `public/art/skills/focus.png`

### Skill scenes (~1200×500, header art for the selected Skill)
- [ ] Creator (studio) → `public/art/skills/creator-scene.webp`
- [ ] Business → `public/art/skills/business-scene.webp`
- [ ] Finance → `public/art/skills/finance-scene.webp`
- [ ] Fitness → `public/art/skills/fitness-scene.webp`
- [ ] Home → `public/art/skills/home-scene.webp`
- [ ] Focus → `public/art/skills/focus-scene.webp`

### Stat & currency icons (96×96, transparent)
- [ ] GP — coin stack → `public/art/icons/gp.png`
- [ ] Quest Points — scroll or quest star (**must differ from Combat Points**) → `public/art/icons/qp.png`
- [ ] Combat Points — crossed swords → `public/art/icons/combat-points.png`
- [ ] Total Level — crown or laurel → `public/art/icons/total-level.png`
- [ ] Collection Log — chest or tome → `public/art/icons/collection-log.png`

### Navigation icons (96×96, transparent)
- [ ] World — compass → `public/art/nav/world.png`
- [ ] Quests — scroll → `public/art/nav/quests.png`
- [ ] Questlines — wheel or map → `public/art/nav/questlines.png`
- [ ] Skills — bars → `public/art/nav/skills.png`
- [ ] Achievement Diaries — book → `public/art/nav/achievement-diaries.png`
- [ ] Combat Achievements — crossed swords → `public/art/nav/combat-achievements.png`
- [ ] Bosses — skull → `public/art/nav/bosses.png`
- [ ] Collection Log → `public/art/nav/collection-log.png`
- [ ] Reward Shop — market stall → `public/art/nav/reward-shop.png`
- [ ] Character — helm → `public/art/nav/character.png`
- [ ] Settings — gear → `public/art/nav/settings.png`

### Brand
- [ ] Questly emblem (logo mark) — 256×256, transparent → `public/art/brand/emblem.png`

## Tier 2 — later phases

### Phase 2 — Core Quest Loop
- [ ] Default Quest thumbnail per Skill (6) — 256×256 → `public/art/quests/default-<skill>.png`
- [ ] Quest template thumbnails (~8: YouTube video, digital product, home project, tax documents, workout goal,
      monthly financial review, deep work sprint, custom) — 256×256 → `public/art/quests/template-<key>.png`
- [ ] Quest Complete celebration scene — ~1200×400 → `public/art/celebrations/quest-complete.webp`

### Phase 3 — Focus, Questlines, Bosses
- [ ] Questline node buildings (~6) — 256×256, transparent → `public/art/questlines/node-<n>.png`
- [ ] Boss portraits (generic set, ~3) — 256×256 → `public/art/bosses/portrait-<n>.png`
- [ ] Boss encounter scene — ~1600×500 → `public/art/bosses/scene.webp`
- [ ] Focus Mode room scene (desk, window, torch) — ~1200×800 → `public/art/focus/room.webp`

### Phase 4 — Meta progression
- [ ] Combat tier shields (6: Easy, Medium, Hard, Elite, Master, Grandmaster) — 128×128, transparent
      → `public/art/combat/tier-<tier>.png`
- [ ] Diary banner (one design; recolored in code for 4 tiers) — 256×320, transparent → `public/art/diaries/banner.png`
- [ ] Collection Log items (40+, across Creator, Business, Finance, Fitness, Home, General/Adventure) —
      128×128, transparent → `public/art/collection/<key>.png` (locked silhouettes are generated in code)
- [ ] Skill Capes (6) and cape art for the Character screen — 256×256, transparent → `public/art/capes/<skill>.png`

### Phase 5 — Rewards + Recovery
- [ ] Reward item art (~8 starter rewards: gaming session, gaming afternoon, nice dinner, new game, hobby
      purchase, tech upgrade, weekend experience, custom) — 256×256 → `public/art/rewards/<key>.png`
- [ ] "You Died" Respawn scene — ~1200×600 → `public/art/respawn/scene.webp`
- [ ] Campfire scene for quote banners — ~1600×300 → `public/art/scenes/campfire.webp`
