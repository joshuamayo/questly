# Questly

**Turn real progress into epic rewards.** One ordered Quest Log, GP for every quest you finish, and a Reward Shop
for the real-life rewards you've earned.

- `CLAUDE.md` — implementation constitution (rules, vocabulary, invariants)
- `QUESTLY_PRODUCT_SPEC.md` — product behavior and game rules

## Status

**V2 — simplified.** One ordered Quest Log: the first active quest is your **Current Quest**; everything after
it is locked until it's next (reorder by drag, keyboard, or menu). Completing the Current Quest earns its GP
exactly once. GP is the only currency, spent in the **Reward Shop** on your own real-life rewards (atomic,
idempotent redemption that can never go negative; optional savings goal). **Completed** keeps a searchable,
month-filterable history, and **Settings** covers profile, appearance, celebrations, defaults, export, and
sign out.

## Going live

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — Vercel + Supabase, with email sign-in links restricted to
`QUESTLY_ALLOWED_EMAILS`. Without Supabase settings Questly runs in local single-player mode (no sign-in);
production builds refuse that mode unless `QUESTLY_ALLOW_NO_AUTH=1`.

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
| `npm run db:setup`     | Apply migrations and create the character with an empty Quest Log if missing.         |
| `npm run db:migrate`   | Apply versioned SQL migrations from `./drizzle`.                                      |
| `npm run db:seed`      | Create the development character (idempotent).                                        |
| `npm run db:seed:demo` | **Opt-in** demo quests and starter rewards. Safe to re-run.                           |
| `npm run db:reconcile` | Replay the GP ledger and verify the cached balance matches.                           |
| `npm run db:reset`     | Delete the **local** embedded database and re-run setup. Refuses to touch `DATABASE_URL`. |
| `npm run db:generate`  | Generate a new migration after editing `src/server/db/schema.ts`.                     |

A fresh character starts with 0 GP and an empty Quest Log. Demo content exists only if you run
`db:seed:demo`; it is defined in one place (`src/server/seed/development.ts`).

### Using Supabase / hosted Postgres

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Set `DATABASE_URL` (Supabase session pooler, port 5432) and the
Supabase Auth variables, then run `npm run db:setup`.

## Quality checks

```bash
npm test             # Vitest: domain unit tests + service integration tests on in-memory Postgres
npm run lint
npm run typecheck
npm run build
```

## Architecture

```
src/
  game/                Pure domain rules — no I/O, unit tested
    quests.ts          Quest Log ordering, Current/Locked derivation, insert/move, validation, GP defaults
    gp.ts              GP ledger invariants + balance projection
    rewards.ts         Reward validation, affordability, savings progress, reward icons, suggestions
    settings.ts        Player settings defaults and validation
    avatar.ts          Pixel avatar configuration
  server/
    db/                Drizzle schema (5 tables), client (Postgres or PGlite), migrator
    gp/                The ONLY code that changes GP (append-only ledger, transactional, idempotent)
    quests/            Add, edit, remove/restore, reorder, complete (Current Quest only)
    rewards/           Reward Shop management and redemption
    settings/          Settings and profile
    auth/              Supabase sign-in, allowlist, character resolution
    export/            Full-account JSON export
    queries.ts         Read models for Server Components
    loaders.ts         Cached per-request loaders
  components/
    questlog/          Quest Log board, quest form, Quest Complete reveal
    rewards/, completed/, settings/
    ui/                Design-system primitives (panels, buttons, dialog, toast…)
    icons/             Original 16×16 pixel-art sprite set rendered as SVG
    shell/             Side rail, mobile top bar, bottom tabs
  app/(realm)/         Routes: Quest Log (/), /reward-shop, /completed, /settings
  app/login, app/auth  Email sign-in link flow
drizzle/               Versioned SQL migrations (0006–0008 migrate V1 data to V2)
```

Visual direction follows the approved mockups in `docs/mockups/` (look and feel only — the spec governs
behavior). Artwork slots are listed in `docs/ART_ASSETS.md`: drop a file at its path under `public/art/` and it
replaces the code-drawn placeholder automatically.

Design tokens live in `src/app/globals.css` (`@theme`). Tailwind's default palette, radii, and shadows are
cleared, so components can only use Questly tokens.
