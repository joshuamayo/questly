# CLAUDE.md --- Questly Implementation Constitution

## Purpose

This file defines the non-negotiable implementation rules for
**Questly**.

Questly is a real-life RPG whose mechanics organize and motivate
real-world work. It is **not** a conventional productivity application
with fantasy decoration.

Read this file before making implementation decisions.

Also read:

-   `QUESTLY_PRODUCT_SPEC.md` --- behavioral/product source of truth
-   approved visual mockups/reference images --- visual source of truth

If implementation convenience conflicts with the product identity,
preserve the product identity unless doing so would create a serious
technical or accessibility problem.

------------------------------------------------------------------------

# 1. Authority Order

When sources disagree, use this priority:

1.  Explicit instruction from the user in the current request
2.  `CLAUDE.md`
3.  `QUESTLY_PRODUCT_SPEC.md`
4.  Approved visual mockups/reference images
5.  Existing code conventions
6.  Your own assumptions

Important distinction:

-   `QUESTLY_PRODUCT_SPEC.md` is the canonical source for **behavior and
    game rules**.
-   Approved mockups are the canonical source for **visual direction and
    atmosphere**.
-   Mockup text/data may contain generation errors and must not override
    canonical product rules.

Never silently reinterpret a conflict. If the conflict materially
changes the product, ask.

------------------------------------------------------------------------

# 2. Core Product Rule

> Questly is not a productivity app with RPG decoration. It is a
> real-life RPG whose underlying mechanics happen to organize and
> motivate real-world work.

Every implementation decision should reinforce:

**Choose adventure → perform meaningful work → complete quest → receive
progression → unlock possibilities → build a permanent account → choose
the next adventure.**

If a feature begins to resemble Jira, Notion, Todoist, Asana, a generic
habit tracker, or a SaaS analytics dashboard, reconsider the
implementation.

------------------------------------------------------------------------

# 3. Do Not Redesign the Product

Do not independently:

-   add new primary navigation items;
-   add new skills;
-   rename canonical systems;
-   change progression rules;
-   replace game terminology with productivity terminology;
-   introduce new currencies;
-   add punitive mechanics;
-   change XP/GP/QP values without instruction;
-   convert World into a task dashboard;
-   turn Collection Log into analytics;
-   turn Questlines into folders;
-   turn Combat Achievements into ordinary tasks;
-   add social/leaderboard features;
-   add AI features merely because they are possible;
-   expand V1 scope.

If you believe a product-level change is necessary, explain the reason
and ask before implementing it.

Small engineering choices that do not affect product behavior do not
require approval.

------------------------------------------------------------------------

# 4. Canonical V1 Vocabulary

Use these exact concepts consistently.

## Primary navigation

1.  World
2.  Quests
3.  Questlines
4.  Skills
5.  Achievement Diaries
6.  Combat Achievements
7.  Bosses
8.  Collection Log
9.  Reward Shop

Bottom: - Character/Profile - Settings

## Skills

Exactly six V1 skills:

-   Creator
-   Business
-   Finance
-   Fitness
-   Home
-   Focus

Do not add: - Family - Productivity - Learning - Social - Mindset -
Creativity - Tools & Tech

unless explicitly requested.

## Difficulty

Quest difficulty:

-   Novice
-   Intermediate
-   Experienced
-   Master
-   Grandmaster

Combat Achievement tiers:

-   Easy
-   Medium
-   Hard
-   Elite
-   Master
-   Grandmaster

Achievement Diary tiers:

-   Easy
-   Medium
-   Hard
-   Elite

## Currency/progression

-   XP --- permanent skill progression
-   GP --- spendable reward currency
-   Quest Points / QP --- permanent quest accomplishment
-   Combat Points --- permanent execution-achievement score

Never use these interchangeably.

------------------------------------------------------------------------

# 5. User-Facing Language

Prefer game-world language.

Use:

-   Accept Quest
-   Create & Accept Quest
-   Continue Quest
-   Current Step
-   Begin Adventure
-   Quest Complete
-   Quest Journal
-   View Requirements
-   Enter Boss Fight
-   Boss Defeated
-   Claim Reward
-   Collection Item Obtained
-   Requirement Met
-   New Quest Available
-   Respawn
-   Adventure
-   Questline
-   Reward Shop

Avoid unless necessary in settings/technical contexts:

-   task
-   ticket
-   issue
-   sprint
-   backlog
-   productivity score
-   workflow
-   resource allocation
-   project status
-   KPI

"Objective" is allowed underneath a Quest.

------------------------------------------------------------------------

# 6. Visual Identity

Questly should evoke a premium modern fantasy MMORPG interface without
copying proprietary RuneScape assets.

## Desired visual language

-   dark stone framing;
-   dark timber/wood details;
-   parchment surfaces;
-   warm gold accents;
-   muted teal/green secondary tones;
-   fantasy landscape artwork;
-   restrained pixel-art influence;
-   illustrated item/skill icons;
-   medieval/game-like framing;
-   modern spacing and usability;
-   strong depth and hierarchy;
-   subtle texture;
-   warm environmental lighting.

## Typography

Use a readable UI typeface for body/interface text.

Decorative medieval/fantasy typography may be used selectively for: -
major screen titles; - quest names; - celebration headings; - section
banners.

Never sacrifice readability for theme.

## Do not produce

-   generic rounded SaaS cards;
-   neon cyberpunk styling;
-   glassmorphism-heavy dashboards;
-   excessive gradients;
-   generic Material UI appearance;
-   sterile white productivity screens;
-   giant analytics charts;
-   modern corporate illustrations;
-   exact copies of RuneScape UI/assets.

------------------------------------------------------------------------

# 7. Design Tokens

Create centralized tokens rather than scattering literal values.

At minimum define:

-   background/base;
-   surface/stone;
-   surface/wood;
-   surface/parchment;
-   border-dark;
-   border-gold;
-   text-primary;
-   text-secondary;
-   text-parchment;
-   accent-gold;
-   accent-green;
-   accent-blue;
-   danger;
-   success;
-   muted;
-   difficulty colors;
-   rarity colors;
-   spacing scale;
-   radius scale;
-   shadow/depth scale;
-   typography scale;
-   animation durations.

Difficulty/status must never rely on color alone.

Icons, labels, or badges must accompany color.

------------------------------------------------------------------------

# 8. Layout Rules

## Desktop

Desktop is the primary V1 design target.

Use: - persistent left navigation; - top account strip; - central
game-world content; - contextual right panels where appropriate.

Do not force every screen into the exact same three-column dashboard.

Each system should have its own game-appropriate composition.

Examples: - Skills → skill grid / mastery panel - Questlines →
progression map/tree - Collection Log → collectible grid - Bosses →
encounter presentation - Focus Mode → minimal encounter view

## Mobile

Mobile must prioritize: 1. Current Adventure 2. Current Step 3. Continue
Quest 4. Focus Mode 5. quick quest capture 6. progression feedback

Do not shrink the entire desktop UI onto a phone.

------------------------------------------------------------------------

# 9. World Screen Rules

World is the default destination.

It must feel like returning to a character/account and current
adventure.

World should emphasize: - character; - current adventure; - current
Boss; - skill progression; - tracked achievement/diary; - recent
unlocks/events.

World must **not** lead with: - overdue task counts; - daily checkbox
lists; - productivity percentages; - generic calendar; - analytics
graphs.

The user should think:

> What adventure am I pursuing?

not:

> What tasks are overdue?

------------------------------------------------------------------------

# 10. Quest Engine Invariants

These are implementation invariants.

## Rewards

Base defaults:

  Difficulty         XP    GP   QP
  -------------- ------ ----- ----
  Novice            100     2    1
  Intermediate      250     5    2
  Experienced       750    15    3
  Master           2000    40    5
  Grandmaster      5000   100   10

Centralize these values.

## Snapshot rule

When a Quest is accepted, snapshot: - difficulty; - XP reward; - GP
reward; - QP reward; - bounty configuration where relevant.

Changing global balance later must not retroactively alter accepted
Quest rewards.

## Completion

Quest completion must be idempotent.

A Quest can never award completion rewards twice.

Use a transaction/event record rather than relying only on UI state.

## Objectives

Objectives primarily advance Quest progress.

Do not independently award full Quest-level XP for every objective.

Never create a loophole where splitting one Quest into many objectives
multiplies progression.

## Abandonment

Abandoned Quests: - award no completion reward; - preserve historical
data; - may be restored if product rules permit; - do not delete history
by default.

------------------------------------------------------------------------

# 11. XP / Level Engine

XP and level calculations must live in a centralized game engine/module.

Requirements:

-   deterministic;
-   unit tested;
-   supports Levels 1--99;
-   exposes current level;
-   XP into current level;
-   XP required for next level;
-   percentage to next level;
-   detects one or multiple level-ups from one reward.

Never calculate levels independently in UI components.

The UI consumes engine output.

------------------------------------------------------------------------

# 12. Currency Ledger

GP, QP, Combat Points, and XP changes should be traceable.

Prefer append-only transaction/event records for progression.

A currency/progression transaction should include: - user; - type; -
amount; - source type; - source id; - timestamp; - metadata.

GP balance may be cached but must be derivable/reconcilable.

Never permit GP to go below zero.

Reward redemption must be atomic: 1. validate balance; 2. deduct GP; 3.
create redemption; 4. create transaction; 5. return success state.

------------------------------------------------------------------------

# 13. Focus System Rules

Focus Mode is an execution environment, not a timer widget.

When active: - minimize navigation; - hide unrelated quests; - emphasize
one Quest; - emphasize one Current Step; - show timer; - permit
objective completion; - show subtle progression feedback.

Default presets: - 25 minutes - 50 minutes - 90 minutes

Focus XP must be computed centrally.

Suggested defaults: - 30 qualifying minutes → 25 XP - 60 qualifying
minutes → 60 XP - 90 qualifying minutes → 100 XP

Implement configurable diminishing returns/daily cap.

Do not encourage unhealthy endless work sessions.

------------------------------------------------------------------------

# 14. Boss Rules

Only one Quest should be visually designated as the **Current Boss** at
a time.

Boss progress may be derived from weighted or equal objective
completion.

Keep the calculation deterministic.

Boss bounty: - is bonus GP; - expires/decays according to configured
timing; - never removes normal Quest rewards; - never deducts GP.

Completing a Boss should trigger a distinct celebration.

------------------------------------------------------------------------

# 15. Questline Rules

Questlines are dependency/progression paths.

They are not project folders.

Support: - ordered and branching dependencies; - locked nodes; -
requirement inspection; - current node; - completed nodes; - Questline
completion reward.

The visual representation should resemble an adventure path/skill
tree/quest dependency map.

Do not default to a table.

------------------------------------------------------------------------

# 16. Achievement Diary Rules

V1 supports: - Weekly Diaries - Monthly Diaries

Tiers: - Easy - Medium - Hard - Elite

Entries can be: - manual; - automatically tracked.

Automatic tracking should use explicit rules, not fragile UI
assumptions.

Examples: - Quest count - Quest type - skill XP - Focus sessions - Boss
completion - deadline performance

Tier rewards may only be claimed once.

Higher-tier rewards require lower-tier completion before claim.

------------------------------------------------------------------------

# 17. Combat Achievement Rules

Combat Achievements measure execution mastery.

They are not another Quest list.

Prefer automatic tracking.

Each Achievement has: - tier; - title; - description; - tracking rule; -
progress; - Combat Point reward; - completion timestamp; - claim state
if required.

Combat Points are permanent and non-spendable.

------------------------------------------------------------------------

# 18. Collection Log Rules

The Collection Log is a collectible museum.

Primary UI must be a **slot/grid collection**, not a metrics page.

Items can be: - visible locked; - secret (`???`); - unlocked.

Unlocks are permanent.

A Collection item may reference: - Quest; - Questline; - Skill
milestone; - Achievement; - Boss; - manual special event.

Unlocking the same unique item twice must not duplicate it.

Optional memories/photos belong to the unlocked item record.

------------------------------------------------------------------------

# 19. Reward Shop Rules

Reward Shop rewards are user-defined real-life rewards.

Do not build a commercial marketplace.

There are: - no microtransactions; - no purchasable GP; - no real-money
checkout; - no gambling mechanics.

Redemption spends GP only.

Show: - current balance; - cost; - affordability; - redemption history.

Reward redemption should feel celebratory but quick.

------------------------------------------------------------------------

# 20. Failure / Recovery Rules

Permanent progression is never removed because of failure.

Never deduct: - XP; - levels; - earned GP; - QP; - Combat Points; -
Collection items.

Missed targets may remove only unearned bonuses.

## Overdue

Avoid a giant red overdue count.

Use:

**Quests Need Attention**

Actions: - Continue - Rescope - Abandon

Preserve original historical deadline.

## Respawn

Respawn is a recovery flow.

It should: 1. explain that permanent progress is safe; 2. review
affected Quests; 3. remove dead commitments; 4. reset realistic targets;
5. select one Respawn Quest; 6. reduce immediate recommended workload;
7. return user to the World.

Do not make Respawn humiliating, punitive, or melodramatically negative.

"You Died" is playful game framing, not judgment.

------------------------------------------------------------------------

# 21. Celebration Rules

Meaningful accomplishments deserve meaningful feedback.

Required celebration states: - Quest Complete - Boss Defeated - Level
Up - Collection Item Obtained - Combat Achievement Complete - Diary Tier
Complete - Reward Redeemed - Requirement Unlocked

Rules: - fast; - skippable; - accessible; - not shown for every trivial
action; - no confetti overload for ordinary objective completion.

If several events occur simultaneously, compose them into a coherent
reward sequence rather than stacking six modals.

------------------------------------------------------------------------

# 22. State Management

Game state must have a clear source of truth.

Avoid: - duplicating derived values across components; - calculating
progress differently on different screens; - storing level separately
when it can be derived from XP unless there is a clear performance
reason; - updating balances optimistically without rollback; - UI-only
completion state.

Prefer domain-level services/functions for: - Quest acceptance; - Quest
completion; - objective completion; - XP awarding; - GP transactions; -
level calculation; - requirement evaluation; - Achievement evaluation; -
Collection unlock evaluation; - Boss progress; - Diary tracking; -
Respawn logic.

------------------------------------------------------------------------

# 23. Event-Driven Progression

A completed meaningful action may affect several systems.

Example:

`QUEST_COMPLETED`

may trigger: 1. award skill XP; 2. award GP; 3. award QP; 4. evaluate
level-up; 5. evaluate Questline; 6. evaluate Diary entries; 7. evaluate
Combat Achievements; 8. evaluate Collection Log; 9. update Boss state;
10. write activity event; 11. return celebration payload.

Implement this in a predictable domain layer.

Do not scatter these side effects across React/Vue/etc. UI components.

------------------------------------------------------------------------

# 24. Requirements Engine

Quest requirements should be extensible.

Initial supported requirement types: - Quest completed - Questline
completed - Skill level - Quest Points - Combat Points - Collection
item - Date reached - manual requirement

Expose a single requirement evaluator.

UI should receive: - requirement description; - current value; -
required value; - met/unmet state.

------------------------------------------------------------------------

# 25. Data Integrity

Important actions should be transactional where supported.

Protect against: - double reward claims; - duplicate Collection
unlocks; - duplicate Achievement rewards; - negative GP; - inconsistent
Quest completion; - accepting the same generated template as the same
Quest entity; - stale reward values.

Prefer soft/archive semantics over destructive deletion for completed
historical entities.

------------------------------------------------------------------------

# 26. Seed Data vs User Data

Keep seed/template content separate from user-created content.

Examples of seed data: - default Combat Achievements; - default
Collection slots; - titles; - quest templates; - sample Reward
templates; - canonical six Skills.

User data should reference seed definitions where appropriate.

Do not mutate global seed definitions when the user progresses.

------------------------------------------------------------------------

# 27. Testing Requirements

Do not treat tests as optional for game logic.

At minimum unit test:

### XP

-   level thresholds;
-   Level 1;
-   Level 99;
-   multi-level reward;
-   next-level progress.

### Quest completion

-   rewards once;
-   abandoned Quest gets no reward;
-   accepted reward snapshot;
-   objective completion does not duplicate rewards.

### GP

-   earning;
-   redemption;
-   insufficient balance;
-   cannot go negative;
-   duplicate redemption protection where relevant.

### Requirements

-   skill requirement;
-   Quest requirement;
-   Questline requirement;
-   QP/Combat Point requirement;
-   Collection requirement.

### Achievements

-   threshold completion;
-   one-time reward;
-   progress update.

### Collection

-   one-time unlock;
-   secret item behavior.

### Respawn

-   does not remove permanent progression.

Add integration tests for the primary Quest loop once the stack supports
them.

------------------------------------------------------------------------

# 28. Accessibility

Theme does not override accessibility.

Must support: - keyboard navigation; - semantic controls; - visible
focus states; - sufficient contrast; - reduced motion; - accessible
dialogs; - labels for icon-only buttons; - timer announcements where
appropriate; - no status communicated only through color.

Decorative artwork should not block or reduce text readability.

------------------------------------------------------------------------

# 29. Performance

Avoid turning decorative UI into a performance problem.

Guidelines: - optimize large background artwork; - lazy-load noncritical
illustrations; - use CSS effects before huge raster overlays when
reasonable; - avoid unnecessary continuous animation; - virtualize large
logs only when needed; - do not load the entire historical account on
every screen.

The World screen should feel immediate.

------------------------------------------------------------------------

# 30. Animation

Use motion to reinforce game feedback.

Good: - XP drop; - progress-bar fill; - Quest Complete reveal; - Level
Up glow; - Collection item reveal; - Boss HP decrease; - requirement
unlock; - panel transition.

Avoid: - constant floating particles everywhere; - distracting looping
motion behind text; - slow transitions that make routine use annoying.

Respect `prefers-reduced-motion`.

------------------------------------------------------------------------

# 31. Audio

Audio is optional and should not block V1.

If added: - default to restrained/off depending on product decision; -
separate ambient and effect volume; - provide mute; - never autoplay
loud audio unexpectedly.

Do not use copyrighted RuneScape audio.

------------------------------------------------------------------------

# 32. Asset Rules

Do not copy or scrape proprietary RuneScape: - logos; - sprites; - item
icons; - maps; - UI textures; - characters; - fonts; - sound effects.

Create original fantasy assets with similar nostalgic genre cues.

Maintain a coherent Questly asset language.

------------------------------------------------------------------------

# 33. Error Handling

Errors should preserve the game tone without obscuring what happened.

Good:

> The quest could not be accepted. Your progress was not changed. Try
> again.

Bad:

> The goblins ate your database request!

Do not sacrifice clarity for jokes.

For destructive or progression-critical failures, be explicit.

------------------------------------------------------------------------

# 34. Loading States

Prefer themed but fast loading states.

Examples: - parchment skeleton; - subtle "Opening Quest Journal..." -
"Loading Adventure..."

Do not add artificial delays just to feel game-like.

------------------------------------------------------------------------

# 35. Empty States

Use the canonical adventure tone.

Examples:

### Quests

> Your Quest Journal is empty. Every adventure starts somewhere.

### Boss

> No foe currently stands between you and your biggest goal.

### Reward Shop

> Your Reward Shop is empty. Add something worth fighting for.

### Collection

> Nothing discovered here yet.

Every empty state should have one obvious next action.

------------------------------------------------------------------------

# 36. Forms

Quest creation and editing must not feel like enterprise forms.

Use progressive disclosure.

Initial Create Quest screen should prioritize: - title; -
flavor/description; - skill; - difficulty; - target; - deadline.

Hide advanced configuration until requested.

Never require every field.

Provide sensible defaults.

Primary CTA:

**CREATE & ACCEPT QUEST**

------------------------------------------------------------------------

# 37. Quick Capture

V1 should support fast capture.

The user must be able to capture an idea/commitment without classifying
everything immediately.

If an Inbox/Capture system is implemented: - one text field; - optional
date; - save instantly; - classify later.

Do not force skill/difficulty/Questline selection during emergency
capture.

Keep this secondary to the RPG experience.

------------------------------------------------------------------------

# 38. Dates and Time

Store timestamps consistently and display them in the user's local
timezone.

Preserve: - target date; - hard deadline; - original missed deadline; -
rescheduled target history where relevant.

Do not silently replace an original deadline during Respawn.

Weekly Diary boundaries must honor configured week start.

------------------------------------------------------------------------

# 39. History

Questly is intended to become valuable over years.

Preserve meaningful history.

Do not hard-delete completed: - Quests; - Questlines; - achievements; -
redemptions; - progression transactions; - Collection unlocks; - Focus
sessions.

Archive where appropriate.

Historical stats should remain reconstructable.

------------------------------------------------------------------------

# 40. Development Workflow

Before implementing a phase:

1.  Read the relevant section of `QUESTLY_PRODUCT_SPEC.md`.
2.  Inspect existing architecture and components.
3.  Identify reusable game systems.
4.  State any assumptions that materially affect product behavior.
5.  Implement the smallest complete vertical slice.
6.  Test domain logic.
7.  Verify visual consistency.
8.  Verify responsive behavior.
9.  Verify no V1 scope creep.
10. Summarize what changed and what remains.

Do not start a second major system while the current phase's core loop
is broken.

------------------------------------------------------------------------

# 41. Build Phases

Follow the Product Spec build order.

## Phase 1 --- Foundation

-   project foundation;
-   data layer;
-   design tokens;
-   shell/navigation;
-   seed user;
-   six Skills;
-   XP/level engine;
-   GP/QP ledger.

## Phase 2 --- Core Quest Loop

-   World;
-   Quest Board;
-   Create Quest;
-   Active Quest;
-   objectives;
-   acceptance;
-   completion;
-   rewards;
-   celebrations.

**Do not proceed until the core loop is enjoyable and stable.**

## Phase 3 --- Focus + Questlines

-   Focus Mode;
-   Focus sessions;
-   Questlines;
-   requirements;
-   locked Quests;
-   Bosses.

## Phase 4 --- Meta Progression

-   Skills;
-   Achievement Diaries;
-   Combat Achievements;
-   Collection Log;
-   Character Profile.

## Phase 5 --- Rewards + Recovery

-   Reward Shop;
-   redemption;
-   weekly planning;
-   streaks;
-   overdue review;
-   Respawn.

## Phase 6 --- Polish

-   responsive;
-   accessibility;
-   animation;
-   optional sound;
-   seed-content refinement;
-   export;
-   performance.

------------------------------------------------------------------------

# 42. Definition of Done for a Feature

A feature is not done because the page renders.

It is done when:

-   behavior matches Product Spec;
-   game terminology is correct;
-   persistence works;
-   rewards cannot duplicate;
-   loading/error/empty states exist;
-   relevant tests pass;
-   keyboard interaction works;
-   responsive behavior is acceptable;
-   visual language matches Questly;
-   no unrelated V1 scope was added.

------------------------------------------------------------------------

# 43. Phase 1 Definition of Done

Phase 1 is complete only when:

-   app boots reliably;
-   user/character exists;
-   navigation shell matches Questly direction;
-   all six Skills are seeded;
-   XP engine is tested;
-   Total Level derives correctly;
-   GP ledger works;
-   QP ledger works;
-   design tokens are centralized;
-   database schema/migrations are reproducible;
-   sample account stats render from real persisted data, not hard-coded
    component values.

------------------------------------------------------------------------

# 44. Phase 2 Definition of Done

Phase 2 is the critical milestone.

The user must be able to:

1.  Open World.
2.  See their character/account.
3.  Open Quests.
4.  Create a Quest.
5.  Accept it.
6.  View its Quest Journal.
7.  Complete objectives.
8.  Complete the Quest.
9.  Receive XP, GP, and QP exactly once.
10. Trigger a Level Up if appropriate.
11. See updated account progression.
12. Experience a satisfying Quest Complete sequence.
13. Reload the app and retain all progress.

If that loop is not excellent, do not hide the problem by building more
systems.

------------------------------------------------------------------------

# 45. Implementation Restraint

Do not over-engineer hypothetical scale.

Questly V1 is a personal application first.

Prefer: - clear domain boundaries; - understandable schema; - testable
functions; - maintainable components; - simple reliable persistence.

Avoid: - microservices; - unnecessary event infrastructure; - premature
queues; - abstract plugin systems; - enterprise permission frameworks; -
elaborate state machines when simple domain logic is sufficient.

Build for extensibility without building unused infrastructure.

------------------------------------------------------------------------

# 46. No Fake Functionality

Do not ship buttons that appear functional but do nothing.

If a feature is not implemented: - hide it; - disable it with clear
explanation; or - mark it as coming later if explicitly desired.

Do not fabricate: - progress; - GP; - XP; - activity history; - dates; -
achievement unlocks.

Seed/demo data is acceptable only when clearly part of initial seeded
account content.

------------------------------------------------------------------------

# 47. No Hard-Coded Dashboard Theater

Do not hard-code visual stats just to match a mockup.

Mockup values such as: - Total Level 347; - 312 Quest Points; - 147
GP; - 312/684 Collection Log;

are illustrative unless explicitly seeded.

All rendered progression should come from the actual domain state.

------------------------------------------------------------------------

# 48. Product Decisions That Must Remain Stable

Unless the user explicitly changes them:

-   six V1 Skills;
-   Level 1--99;
-   Total Level max 594;
-   permanent XP;
-   permanent QP;
-   permanent Combat Points;
-   GP spendable but never punitive;
-   one Current Boss emphasized;
-   up to three Main Quests recommended;
-   target date separate from hard deadline;
-   Quest objectives do not independently farm XP;
-   World is account/adventure-first;
-   Collection Log is collectible-first;
-   Combat Achievements are execution challenges;
-   Diaries are Easy/Medium/Hard/Elite;
-   Respawn protects permanent progress;
-   no microtransactions;
-   no social/leaderboards in V1.

------------------------------------------------------------------------

# 49. When Unsure

Ask:

> Does this make Questly feel more like a persistent real-life RPG, or
> more like a productivity app?

Prefer the RPG experience while keeping the underlying system reliable
and easy to use.

If still uncertain and the choice materially affects behavior, ask the
user.

------------------------------------------------------------------------

# 50. Final Instruction

Build Questly as though the user may still be using the same character
five years from now.

The account should accumulate meaning.

Quests should feel completed, not deleted.

Levels should feel earned.

Collection items should feel discovered.

Bosses should feel defeated.

Rewards should feel deserved.

Falling behind should feel recoverable.

The product succeeds when real-world progress feels like progressing an
RPG account.

------------------------------------------------------------------------

# Appendix --- Framework notes

@AGENTS.md
