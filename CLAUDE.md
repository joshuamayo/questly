# CLAUDE.md — Questly V2 Implementation Constitution

## Status

This file fully replaces all previous Questly `CLAUDE.md` instructions.

Read `QUESTLY_PRODUCT_SPEC.md` before changing the application.

Questly has intentionally been redesigned into a dramatically simpler product.

Do not preserve old complexity merely because it exists in the codebase.

## 1. Core Rule

Questly answers:

> **What do I do next?**

One ordered Quest Log. First unfinished Quest is Current. Complete it, earn GP, unlock the next. GP buys personal Rewards.

Protect that simplicity.

## 2. Authority

1. Current explicit user instruction
2. This `CLAUDE.md`
3. Current `QUESTLY_PRODUCT_SPEC.md`
4. Approved V2 mockups
5. Existing code
6. Your assumptions

Old specs and old behavior are not authoritative.

## 3. Preserve Useful Existing Work

Preserve/refactor when useful:
- Questly branding
- fantasy visual system
- design tokens
- original artwork/backgrounds
- stone/wood/parchment components
- adaptable navigation shell
- buttons/modals
- accessibility primitives
- responsive utilities
- database/auth infrastructure
- clean GP ledger infrastructure
- tests
- animation/sound utilities
- original Questly assets

## 4. Remove Old Complexity

Remove from navigation, UI, active domain logic, and eventual schema where obsolete:
- Skills
- XP
- Levels / Total Level
- QP
- Combat Points
- Questlines
- Bosses
- Achievement Diaries
- Combat Achievements
- Collection Log
- Focus Mode / Focus XP
- Weekly Planning
- Respawn
- Streaks
- difficulty tiers
- requirements/dependencies
- capes/progression titles
- bounties

Do not leave visible remnants.

Inspect dependencies before deleting shared code.

## 5. Refactor, Don't Blindly Rebuild

The existing app is valuable.

Goal:

> Keep the cool Questly shell and technical foundation. Remove the game-management burden.

Do not throw away good components unnecessarily.

## 6. Navigation

Exactly:
- Quest Log
- Reward Shop
- Completed
- Settings

Quest Log is default/home.

Sidebar may show logo, avatar, display name, and GP.

## 7. Core Entities

Canonical:
- User
- Quest
- GPTransaction
- Reward
- RewardRedemption

Additional infrastructure fields are acceptable when technically justified, but do not recreate removed systems under new names.

## 8. Ordering

Every active Quest has deterministic ordering.

Derive:

`currentQuest = orderedActiveQuests[0]`

`lockedQuests = orderedActiveQuests.slice(1)`

Do not redundantly store Current/Locked unless technically necessary.

## 9. Completion Guard

Domain/backend logic must enforce:

> Only Current Quest can be completed.

Disabled UI is insufficient.

A locked-Quest completion request must fail safely.

## 10. Reordering

Active Quests can reorder.

Require:
- drag-and-drop
- keyboard alternative
- persistence
- deterministic positions
- immediate Current recalculation
- safe handling of concurrent/stale state where relevant
- optimistic UI with rollback when practical

Do not add priority matrices, urgency scores, projects, or scheduling systems.

## 11. Add Quest

Required:
- title

Optional:
- description
- GP reward
- insert position

Defaults:
- configured GP
- end of list

Keep creation extremely fast.

## 12. GP

GP is the only progression currency.

No XP, Levels, QP, or Combat Points.

Rules:
- completion adds GP once;
- redemption subtracts once;
- GP never negative;
- transactions auditable;
- UI never directly mutates balance;
- completion/redemption are atomic.

## 13. Completion Transaction

Atomically:
1. validate active;
2. validate Current;
3. validate not already rewarded;
4. mark completed;
5. timestamp;
6. award stored GP;
7. write transaction;
8. calculate next Current;
9. return celebration payload.

Idempotency is mandatory.

## 14. Reward Redemption

Atomically:
1. validate Reward;
2. validate balance;
3. deduct GP;
4. write transaction;
5. create redemption;
6. update one-time Reward if necessary;
7. return confirmation.

Never allow negative GP.

## 15. Quest Log UI

Priority:
1. Current Quest
2. ordered list
3. Add Quest
4. GP
5. Reward Shop shortcut
6. optional savings goal/recent completions

No dashboards/charts/widget clutter.

The list is the product.

## 16. Current Quest

Make unmistakable.

Show:
- title
- description if present
- GP
- Complete Quest

Completion must not be buried.

## 17. Locked Quests

Locked means:

> Not yet. Finish or reorder what comes first.

Keep readable and editable/reorderable. Lock prevents completion, not planning.

## 18. Completed

Show:
- title
- completion date
- GP earned

Optional search/date filter.

No analytics, productivity score, streak chart, or grading.

## 19. Reward Shop

Show:
- balance
- Reward cards
- cost
- affordability
- Redeem
- Add/Edit/Archive
- optional one featured savings goal

Not ecommerce.

## 20. Settings

Allowed:
- display name/avatar
- appearance/background
- reduced motion
- sound
- minimal reminders
- default Quest GP
- optional completion confirmation
- simple display toggles
- export/account controls

Remove old game-balance settings.

## 21. Visual Identity

Preserve high-quality fantasy presentation:
- dark
- atmospheric
- warm
- gold-accented
- parchment/stone/wood
- game-like
- polished
- readable

Simplify mechanics, not personality.

## 22. No Feature Creep

Do not independently add:
- projects
- categories
- tags
- priorities
- due-date systems
- calendars
- habits
- subtasks
- dependencies
- multiple queues
- smart lists
- AI prioritization
- streaks
- achievements
- analytics dashboards
- XP/levels

Common to-do-app features are not automatically appropriate.

## 23. Migration

Preserve meaningful:
- identity/account
- GP where sensible
- compatible Rewards
- Quest-like records that map cleanly

Back up before destructive migrations.

Do not invent misleading mappings.

For purely demo/seed data, simplify aggressively.

Never silently delete meaningful user data.

## 24. Database Cleanup Order

1. Stop using old systems.
2. Remove old routes/navigation.
3. Migrate retained data.
4. Verify V2.
5. Identify orphaned schema.
6. Remove obsolete schema via migrations.

Do not drop everything first.

## 25. Required Tests

### Ordering
- first active = Current
- later = locked
- reorder changes Current
- completed ignored

### Completion
- only Current completes
- locked rejected
- GP once
- duplicate completion safe
- next becomes Current

### GP
- earn
- spend
- insufficient balance
- never negative

### Rewards
- redemption
- one-time
- repeatable
- transaction recorded

### Reordering
- deterministic positions
- no corrupt/duplicate ordering

## 26. Accessibility

Maintain:
- keyboard navigation
- accessible reorder controls
- semantic buttons
- visible focus
- contrast
- reduced motion
- labeled icons
- accessible dialogs

## 27. Performance

The active list may become large and Completed history may become very large.

Do not render all historical completed Quests on the main Quest Log.

Keep active-list interactions fast.

## 28. No Fake Data in Components

Mockup values are illustrative.

Do not hard-code `1,280 GP`, `47 Quests`, MangoStax, or a New Monitor goal unless deliberately present in seed data.

Render actual state.

## 29. Errors

Be clear:

> This quest isn't next. Reorder it first if you want to work on it now.

> You need 25 GP to redeem this reward.

> The quest could not be completed. Your GP was not changed.

Clarity beats fantasy jokes.

## 30. V2 Definition of Done

V2 refactor is complete when:
1. Quest Log is home.
2. Only four primary nav destinations exist.
3. Exactly one Current Quest is presented.
4. Future Quests are ordered and locked from completion.
5. Future Quests reorder.
6. Add Quest takes seconds.
7. Current completion awards GP exactly once.
8. Quest Complete celebration works.
9. Next Quest becomes Current automatically.
10. Reward Shop works.
11. Redemption safely spends GP.
12. Completed works.
13. Settings is simplified.
14. Removed systems are no longer visible or unnecessarily executing.
15. Persistence survives reload.
16. Core tests pass.
17. lint/typecheck/build pass.
18. Product feels substantially simpler than V1.

## 31. Final Test

A new user should understand Questly in about 30 seconds:

> “I put everything I need to do in order. It tells me what's next. I complete it, get GP, and use GP to unlock rewards.”

If explanation requires more systems than that, complexity has returned.

## 32. Final Instruction

Optimize Questly for **relief**, not feature count.

Opening it should reduce decisions.

The ideal interaction:

> Here is the next thing.  
> Do it.  
> Nice work. +10 GP.  
> Here is the next thing.

Protect this simplicity.

------------------------------------------------------------------------

# Appendix — Framework notes

@AGENTS.md
