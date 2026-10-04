# QUESTLY — Simplified Product Specification

**Version:** V2 Simplified  
**Status:** Canonical replacement for all previous Questly specifications  
**Tagline:** One quest at a time. Real progress. Real rewards.

## 1. Product Definition

Questly is a deliberately simple, game-inspired to-do system designed to answer one question:

> **What do I do next?**

The user maintains one large ordered Quest Log. Only the first unfinished Quest is the **Current Quest**. Everything after it is waiting its turn.

Complete Current Quest → earn GP → next Quest unlocks automatically → spend GP in a personal Reward Shop.

That is the core product.

## 2. Product Philosophy

### One path
There is one master Quest Log. No separate projects, skill trees, bosses, questlines, diaries, achievements, or parallel progression systems.

### One Current Quest
Exactly one unfinished Quest is current: the first unfinished Quest in the ordered list.

### Future Quests are visible but locked
The user can see what comes next, but cannot complete future Quests out of order.

Future Quests **can be reordered**. This means the user can change the plan, but cannot casually skip the plan.

### Simplicity is a feature
Every additional concept must justify the mental overhead it creates. Default to fewer systems.

## 3. Core Loop

**Add → Order → Do → Complete → Earn GP → Unlock Next → Redeem Rewards**

## 4. Canonical Systems

Questly has only four core systems:

1. **Quest Log**
2. **GP**
3. **Reward Shop**
4. **Completed Log**

Settings supports these systems but is not another game system.

## 5. Removed Systems

The following are intentionally removed:

- Skills
- XP
- Levels / Total Level
- Quest Points
- Combat Points
- Questlines
- Bosses
- Achievement Diaries
- Combat Achievements
- Collection Log
- Focus Mode / Focus XP
- Weekly Planning
- Respawn
- Streaks / Streak Shields
- Difficulty tiers
- Skill/quest requirements
- Dependency trees
- Main vs Side Quests
- Skill capes
- progression titles
- bounties

Do not preserve these merely because they exist in old code.

## 6. Navigation

Exactly four primary destinations:

1. **Quest Log**
2. **Reward Shop**
3. **Completed**
4. **Settings**

Quest Log is the home/default route.

Sidebar may also show:
- Questly logo
- avatar
- display name
- GP balance

## 7. Quest Log / Home

This is the product's primary screen and should receive most design attention.

It contains:
- Current Quest
- ordered active Quest Log
- Add Quest
- GP summary
- Reward Shop shortcut
- optional featured Reward savings goal
- optional compact recent-completions section

Do not turn this into a dashboard.

## 8. Current Quest

The first unfinished active Quest becomes Current automatically.

Display:
- title
- optional description
- GP reward
- **Complete Quest** button

Optional lightweight actions:
- Edit
- Delete/archive
- Move/reorder

No separate complicated Quest Detail screen is required.

## 9. Quest States

### Completed
Finished and stored permanently in Completed.

### Current
The first active Quest. Clearly highlighted and completable.

### Locked
Every active Quest after Current. Visible and editable/reorderable, but not completable.

Current and Locked should normally be **derived states**, not database statuses.

## 10. Chronological Rule

For:

`Q1 → Q2 → Q3 → Q4`

If Q1 and Q2 are completed:
- Q3 = Current
- Q4 = Locked

Q4 cannot complete while Q3 is Current.

If the user reorders to:

`Q1 → Q2 → Q4 → Q3`

Q4 immediately becomes Current.

This rule is canonical.

## 11. Reordering

Active Quests can be reordered easily.

Requirements:
- drag-and-drop
- keyboard-accessible alternative
- persistent ordering
- Current recalculated immediately
- completed history not reorderable
- undo feedback when practical

Do not add priorities, urgency scores, matrices, or scheduling systems as substitutes for ordering.

## 12. Add Quest

Adding a Quest should take seconds.

Required:
- **Quest Title**

Optional:
- Description
- GP Reward
- Insert Position

Defaults:
- GP = user-configured default
- Position = end of list

Suggested GP quick choices:
- 5
- 10
- 15
- 20
- 50

Custom values allowed.

Primary CTA: **Add Quest**

Do not request skills, difficulty, XP, QP, questlines, bosses, tags, categories, requirements, or effort estimates.

## 13. Fast Capture

Ideal interaction:
1. Open Add Quest.
2. Type title.
3. Press Enter.
4. Quest appears at end.

Optional GP/position adjustments should not slow basic capture.

## 14. GP

GP is the **only progression currency**.

Mental model:

> Complete real-world things → earn GP → spend GP on things you want.

Rules:
- Quest completion awards GP.
- Quest reward is stored on the Quest.
- Each Quest awards GP once.
- Reward redemption deducts GP.
- GP cannot go below zero.
- Editing/reordering/deleting unfinished Quests awards nothing.
- Completed Quest GP is not automatically removed.
- Transactions are permanent/auditable.

## 15. Quest Completion

Only Current Quest can complete.

Atomic flow:
1. validate Quest is Current;
2. mark complete;
3. record completion time;
4. award stored GP exactly once;
5. create GP transaction;
6. determine next Current Quest;
7. return celebration payload.

Backend/domain logic must enforce ordering—not just disabled UI.

## 16. Quest Complete Celebration

Primary completion payoff:

**Quest Complete!**

`[Quest Title]`

**+10 GP**

CTA: **Continue to Next Quest**

May include:
- coin animation
- warm glow
- short optional sound
- next-Quest reveal

No XP, levels, achievements, or secondary progression.

## 17. Reward Shop

User-created real-world rewards.

Examples:
- 1 Hour of OSRS — 15 GP
- Favorite Lunch — 25 GP
- Gaming Afternoon — 50 GP
- Buy Something I've Been Wanting — 100 GP
- New Tech / Gear — 250 GP
- Weekend Getaway — 500 GP

Rewards are voluntary motivators, not permission for ordinary rest or normal life.

## 18. Reward Model

Fields:
- id
- user_id
- name
- optional description
- gp_cost
- optional icon/image
- repeatable
- active
- featured_goal
- created_at

## 19. Reward Shop UI

Show:
- GP balance
- Reward cards
- cost
- affordability
- Redeem
- Add Custom Reward

Optional simple views:
- All
- Available
- Not Yet Affordable
- Redeemed

Do not turn this into ecommerce.

## 20. Reward Redemption

Atomic flow:
1. validate Reward;
2. validate sufficient GP;
3. deduct GP;
4. create GP transaction;
5. create redemption record;
6. update one-time Reward if applicable;
7. show confirmation.

Never permit negative GP.

## 21. Featured Savings Goal

Optionally feature one Reward:

**Saving for: New Monitor**  
`182 / 300 GP`

This is only a visualization of current GP versus Reward cost—not a new wallet or currency.

## 22. Completed Log

Permanent history intended to communicate:

> Look at everything you've actually gotten done.

Show:
- Quest title
- completion date
- GP earned

Top may show total Quests completed.

Optional:
- search
- month/year filter

No charts, productivity scores, streaks, or performance grading.

## 23. Completed History Integrity

Completed history should be stable.

Do not:
- reorder it;
- change awarded GP silently;
- casually uncomplete items.

Any future reversal must create an explicit corrective GP transaction.

## 24. Settings

Keep Settings small.

### Profile
- display name
- avatar

### Appearance
- theme/background
- reduced motion
- optional sound

### Notifications
- optional reminders
- completion/reward feedback preferences

### Game Settings
- default Quest GP reward
- optional completion confirmation
- optional display toggles

### Data
- export
- account/data management

No complex game-balance controls.

## 25. Visual Direction

Preserve the existing Questly fantasy identity:

- premium fantasy RPG interface
- dark stone
- timber
- parchment
- warm lantern light
- gold accents
- scenic fantasy environment
- tasteful illustrated/pixel influence
- game-like icons
- high readability

**Simple mechanics, rich presentation.**

Do not simplify the visual identity into generic SaaS UI.

## 26. Originality

Do not copy proprietary RuneScape assets, logos, sprites, maps, icons, characters, fonts, sounds, or exact UI elements.

Genre inspiration is acceptable; Questly branding/assets must be original.

## 27. Empty States

### Quest Log
> Your Quest Log is empty. Every adventure starts somewhere.

**Add Your First Quest**

### Completed
> No quests completed yet. Your first victory is waiting.

### Reward Shop
> Your Reward Shop is empty. Add something worth working toward.

## 28. Notifications

Keep minimal.

Possible:
- optional Current Quest reminder
- optional Reward-now-affordable notification

Avoid nagging.

## 29. Responsive Behavior

### Desktop
Sidebar + main Quest Log + optional compact GP/Reward information.

### Mobile
Prioritize:
1. Current Quest
2. Complete Quest
3. Quest Log
4. Add Quest
5. GP
6. Reward Shop

## 30. Accessibility

Require:
- keyboard navigation
- semantic controls
- visible focus states
- sufficient contrast
- reduced motion
- accessible dialogs
- labeled icons
- drag/reorder alternatives
- status not communicated by color alone

## 31. Data Model

### User
- id
- display_name
- avatar
- gp_balance
- created_at
- settings

### Quest
- id
- user_id
- title
- description
- gp_reward
- position
- status
- created_at
- completed_at
- archived_at

Simple stored statuses:
- active
- completed
- archived

Current/Locked derive from ordering among active Quests.

### GPTransaction
- id
- user_id
- amount
- transaction_type
- source_type
- source_id
- description
- created_at

### Reward
- id
- user_id
- name
- description
- gp_cost
- image/icon
- repeatable
- active
- featured_goal
- created_at

### RewardRedemption
- id
- user_id
- reward_id
- gp_cost_snapshot
- redeemed_at

## 32. Derived State

**Current Quest:** first active Quest by position.

**Locked Quests:** all active Quests after Current.

**Featured Reward progress:** current GP / selected Reward cost.

GP balance may be cached, but transactions remain auditable.

## 33. Data Integrity

Required:
- Quest GP awarded once.
- Redemption deducts once.
- GP never negative.
- ordering deterministic.
- completed history retained.
- transactions auditable.
- destructive actions confirmed when appropriate.

## 34. Screen Inventory

Only four primary screens:

1. **Quest Log / Home**
2. **Reward Shop**
3. **Completed**
4. **Settings**

Supporting overlays/states:
- Add Quest
- Edit Quest
- Quest Complete
- Add/Edit Reward
- Reward Redeemed
- delete/archive confirmation

Do not add more primary screens without explicit approval.

## 35. Success Test

Questly succeeds if the user can:
1. open it and instantly know what to do next;
2. add a Quest in seconds;
3. see later work without choosing among it;
4. reorder when priorities truly change;
5. complete only Current Quest;
6. earn GP;
7. watch the next Quest unlock;
8. save toward/redeem Rewards;
9. review Completed history;
10. understand the entire product without documentation.

## 36. Canonical Rules

1. One master Quest Log.
2. Exactly one Current Quest.
3. Current = first unfinished active Quest.
4. Future Quests cannot complete.
5. Future Quests can reorder.
6. Reordering can change Current.
7. GP is the only progression currency.
8. Current completion awards GP once.
9. Next Quest unlocks automatically.
10. Rewards spend GP.
11. GP never negative.
12. Completed is permanent history.
13. Quest creation is fast.
14. No Skills, XP, Levels, QP, Combat Points, Bosses, Questlines, Diaries, Combat Achievements, Collection Log, Focus Mode, streaks, or Respawn.
15. Rich fantasy presentation remains.
16. Simplicity outranks feature count.
17. This document supersedes all previous Questly product specifications.

## 37. Product North Star

Questly should require almost no management once the list is ordered.

The experience:

> **Do this.**

Then:

> **Quest Complete. +10 GP. Here's what's next.**

That is the product.
