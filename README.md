# Questly

**Real Progress. Epic Rewards.** A real-life RPG whose mechanics organize and motivate real-world work.

- `CLAUDE.md` — implementation constitution (rules, vocabulary, invariants)
- `QUESTLY_PRODUCT_SPEC.md` — product behavior and game rules

## Status

- **Phase 1 — Foundation:** shell, design system, six Skills, XP engine, progression ledger.
- **Phase 2 — Core Quest Loop:** Quest Journal, Quest Board (templates), Create & Accept Quest, Active Quest
  (Quest Journal, Current Step, objectives, notes, status), idempotent completion with snapshotted rewards,
  Quest Complete + Level Up celebration, World Current Adventure.

## Quick start

```bash
npm install
npm run dev          # migrates + seeds automatically, then starts http://localhost:3000
```

No credentials are required. Without `DATABASE_URL`, Questly uses **PGlite** — real PostgreSQL compiled to
WASM — persisted to `./.data/pglite`. It uses the same schema and migrations as production Postgres.

> PGlite is single-process. Stop `npm run dev` before running `db:*` scripts against the local database.

### Database scripts

| Script                 | What it does                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `npm run db:setup`     | Apply migrations, seed Skills/Titles/Capes, create the character "Joshua" if missing. |
| `npm run db:migrate`   | Apply versioned SQL migrations from `./drizzle`.                                      |
| `npm run db:seed`      | Seed content + the development character (idempotent).                                |
| `npm run db:seed:demo` | **Opt-in** demo progression (XP/GP/QP/CP) written through the real ledger as `SEED_DEMO`. Safe to re-run. |
| `npm run db:reconcile` | Replay the ledger and verify cached balances match.                                   |
| `npm run db:reset`     | Delete the **local** embedded database and re-run setup. Refuses to touch `DATABASE_URL`. |
| `npm run db:generate`  | Generate a new migration after editing `src/server/db/schema.ts`.                     |

A fresh character starts at Level 1 in all six Skills with 0 GP/QP/Combat Points. Demo progression exists only
if you run `db:seed:demo`; it is defined in one place (`src/server/seed/development.ts`).

### Using Supabase / hosted Postgres

Copy `.env.example` to `.env` and set `DATABASE_URL` (Supabase → Project Settings → Database → connection
string, pooler URI). Then run `npm run db:setup`. Supabase Auth is not wired yet; the app currently plays the
single seeded character (see `resolveCurrentCharacterId`).

## Quality checks

```bash
npm test             # Vitest: engine unit tests + ledger integration tests on in-memory Postgres
npm run lint
npm run typecheck
npm run build
```

## Architecture

```
src/
  game/                Pure game engine — no I/O, fully unit tested
    config/balance.ts  Game balance: XP curve, Quest rewards, Focus XP, bounty, Respawn, Main Quest cap
    vocabulary.ts      Canonical keys: Skills, difficulties, tiers, progression kinds
    xp.ts              Level 1–99 curve, level progress, multi-level-up detection
    ledger.ts          Ledger invariants + balance projection/replay
    character.ts       Derived stats: Total Level (max 594), account age
    content/           Seed definitions: six Skills, Titles, Skill Capes
  server/
    db/                Drizzle schema, client (Postgres or PGlite), migrator
    progression/       The ONLY code that changes XP/GP/QP/Combat Points (transactional)
    characters/        Character creation
    queries/           Read models for Server Components (level math via the engine)
    seed/              Content + development seed
  components/
    ui/                Design-system primitives (panels, buttons, bars, badges, dialog, tooltip…)
    icons/             Original 16×16 pixel-art sprite set rendered as SVG
    shell/             Rail, account strip, mobile drawer, bottom tabs
    art/, character/   World vista artwork, pixel avatar
  app/(realm)/         Routes: World (/), Skills, Character, and placeholder systems
drizzle/               Versioned SQL migrations
```

Visual direction follows the approved mockups in `docs/mockups/` (look and feel only — the spec governs
behavior). Artwork slots are listed in `docs/ART_ASSETS.md`: drop a file at its path under `public/art/` and it
replaces the code-drawn placeholder automatically.

Design tokens live in `src/app/globals.css` (`@theme`). Tailwind's default palette, radii, and shadows are
cleared, so components can only use Questly tokens.
