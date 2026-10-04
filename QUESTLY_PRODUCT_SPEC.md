# QUESTLY --- Product Specification

**Version:** V1 Build Specification\
**Status:** Design direction locked; ready for implementation\
**Product:** Questly\
**Tagline:** Real Progress. Epic Rewards.

------------------------------------------------------------------------

## 1. Product Vision

Questly is a real-life RPG whose underlying mechanics organize and
motivate real-world work.

It is **not** a productivity app with RPG decoration.

The user should feel like they are logging into a persistent
character/account, choosing adventures, progressing skills, completing
quests, defeating bosses, unlocking achievements, filling a Collection
Log, earning currency, and receiving meaningful rewards.

Deadlines, subtasks, scheduling, reminders, recurrence, and
project-management mechanics exist underneath the experience, but the UI
should expose them only when they are useful.

### Primary design rule

> Whenever there is a choice between exposing productivity machinery and
> preserving the feeling of playing a game, keep the machinery
> underneath and preserve the game experience.

### Problem Questly solves

Traditional task managers often become: - giant lists of obligations; -
graveyards of overdue tasks; - systems that reward checking boxes rather
than meaningful progress; - stressful after a user falls behind; -
boring enough that the user stops opening them.

Questly should instead create: - clear progression; - anticipation; -
permanent accomplishments; - meaningful short-term rewards; - long-term
account growth; - recovery without shame; - a strong reason to return.

------------------------------------------------------------------------

## 2. Product Principles

### 2.1 Account first, tasks second

The user is building a persistent character.

The primary mental model is:

**Character → Skills → Quests → Unlocks → Achievements → Collection →
Rewards**

not:

**Projects → Tasks → Subtasks → Due dates**

### 2.2 Meaningful accomplishments earn progression

Do not award meaningful XP for every tiny checkbox.

Objectives advance quests. Quests award the majority of XP, GP, and
Quest Points.

This prevents the optimal strategy from becoming "create 100 tiny
tasks."

### 2.3 Failure removes opportunity, not progress

Questly should not take away XP, levels, GP, achievements, or Collection
Log entries because the user misses a day.

Missing something may mean: - a bounty expires; - a streak ends; - a
tier is not completed; - a bonus is not earned.

Permanent progress remains permanent.

### 2.4 Recovery is part of the game

Falling behind triggers a recovery mechanic rather than a wall of red
overdue tasks.

The system should make returning feel like **respawning**, not
confessing failure.

### 2.5 The game should create direction

Questly is not only a tracker.

It should help answer:

> What should I work toward next?

### 2.6 Avoid over-gamifying normal life

Normal relationships, rest, family time, meals, and basic recreation
should not require currency or XP.

The reward system is for deliberate indulgences and motivating
rewards---not permission to live normally.

------------------------------------------------------------------------

# 3. Visual Direction

Questly should feel heavily inspired by the **psychology and information
hierarchy of classic MMORPG interfaces**, especially Old School
RuneScape, without copying copyrighted game assets, logos, maps,
characters, icons, or UI artwork.

## 3.1 Desired aesthetic

-   medieval/fantasy adventure atmosphere;
-   dark stone and timber framing;
-   warm gold accents;
-   parchment surfaces where appropriate;
-   scenic fantasy landscapes;
-   restrained pixel-art influence;
-   illustrated icons;
-   game-like panels and tabs;
-   high readability;
-   premium modern spacing and interaction quality.

The result should feel like:

**a modern premium web application built inside a classic fantasy RPG
interface.**

## 3.2 Avoid

-   generic SaaS dashboards;
-   Material Design cards;
-   productivity-app charts everywhere;
-   giant KPI dashboards;
-   excessive gradients;
-   generic fantasy clip art;
-   copying RuneScape assets;
-   turning every screen into a task list;
-   exposing database terminology;
-   excessive visual clutter simply because game UIs can be dense.

## 3.3 Core shell

Desktop V1 uses a persistent left navigation rail.

Navigation:

1.  World
2.  Quests
3.  Questlines
4.  Skills
5.  Achievement Diaries
6.  Combat Achievements
7.  Bosses
8.  Collection Log
9.  Reward Shop

Bottom: - Character summary - Settings

Persistent compact account strip: - Total Level - Quest Points - GP -
avatar/account menu

------------------------------------------------------------------------

# 4. Core Character System

Every user has one persistent character.

## 4.1 Character stats

Profile should surface:

-   Display name
-   Avatar
-   Equipped title
-   Equipped cape/cosmetic
-   Account creation date
-   Account age
-   Total Level
-   Total XP
-   Quest Points
-   Combat Points
-   GP balance
-   Collection Log completion
-   Achievement Diary completion
-   Quests completed
-   Bosses defeated
-   Focus sessions/hours
-   Personal bests
-   Deaths / Respawns

## 4.2 V1 Skills

V1 contains exactly six core skills:

1.  **Creator** --- content creation, publishing, scripting, recording,
    editing.
2.  **Business** --- products, companies, sales, operations,
    sponsorships.
3.  **Finance** --- financial planning, investing, taxes, financial
    administration.
4.  **Fitness** --- training and physical goals.
5.  **Home** --- home projects, maintenance, organization.
6.  **Focus** --- execution quality, deep work, deadline performance,
    consistency.

Do not add Social, Family, Learning, Mindset, Creativity, Tools & Tech,
Productivity, or other skills in V1.

Additional skills may become configurable later.

### Focus is special

Most skills answer:

> What did you accomplish?

Focus answers:

> How effectively did you execute?

Focus XP comes primarily from: - deep-work sessions; - Combat
Achievements; - Boss completion; - completing quests before target
dates; - execution milestones.

------------------------------------------------------------------------

# 5. XP and Levels

## 5.1 Level range

Each skill ranges from **Level 1--99**.

Total Level maximum in V1:

**594**

Use an exponential progression curve inspired by classic MMORPG
leveling.

Implementation should keep the XP curve in a configurable function/table
rather than hard-coding UI values.

## 5.2 Quest base XP

Default values:

  Difficulty       Base XP
  -------------- ---------
  Novice               100
  Intermediate         250
  Experienced          750
  Master             2,000
  Grandmaster        5,000

XP is awarded to the quest's associated skill.

### Important

Objectives do **not** normally award independent skill XP.

Objective-level XP may be displayed during Focus Mode as a visualization
of the quest reward allocation, but total awarded quest XP must never
exceed the quest's configured reward.

## 5.3 Level-up experience

When a level increases, trigger a dedicated celebration state.

Example:

**LEVEL UP!**\
Creator\
47 → 48

Milestone levels may unlock: - titles; - cosmetic frames; - new quest
difficulties; - achievement content; - capes at 99.

## 5.4 Skill capes

Level 99 unlocks a cosmetic Skill Cape.

Skill Capes provide no productivity advantage.

They are status rewards.

------------------------------------------------------------------------

# 6. Quest Points

Quest Points represent lifetime quest accomplishment.

Suggested defaults:

  Difficulty       QP
  -------------- ----
  Novice            1
  Intermediate      2
  Experienced       3
  Master            5
  Grandmaster      10

QP is permanent.

It may gate: - quest requirements; - titles; - cosmetics; - Collection
Log items; - future quest content.

------------------------------------------------------------------------

# 7. GP Economy

GP is spendable reward currency.

XP = permanent progression.\
GP = spendable motivation.

## 7.1 Suggested quest GP

  Difficulty        GP
  -------------- -----
  Novice             2
  Intermediate       5
  Experienced       15
  Master            40
  Grandmaster      100

All values must be configurable.

## 7.2 GP rules

-   GP never goes negative.
-   Missing deadlines never removes earned GP.
-   GP is only deducted when a reward is redeemed.
-   Abandoned quests award no completion GP.
-   Reward history is permanent.
-   Lifetime earned and lifetime spent are tracked separately.

## 7.3 Reward Shop

Users create rewards they genuinely want.

Examples: - guilt-free gaming session; - OSRS afternoon; - nice meal; -
new game; - clothing purchase; - tech purchase; - hobby item; - weekend
experience; - larger wishlist reward.

Reward fields: - name; - description; - category; - image/icon; - GP
price; - active/archived; - optional real-world estimated value; -
repeatable yes/no; - redemption history.

The app must never imply the user needs GP for ordinary rest,
relationships, food, or basic recreation.

------------------------------------------------------------------------

# 8. Quest System

Quests are the primary unit of meaningful work.

## 8.1 Quest fields

A Quest includes:

-   id
-   title
-   flavor description
-   associated skill
-   difficulty
-   status
-   target date
-   hard deadline (optional)
-   accepted date
-   completed date
-   abandoned date
-   questline id (optional)
-   boss flag
-   objective list
-   requirements
-   reward XP
-   reward GP
-   reward QP
-   Collection Log reward (optional)
-   bounty (optional)
-   recurrence configuration (optional)
-   notes
-   activity/history
-   estimated effort (optional)
-   artwork/icon
-   current objective

## 8.2 Quest statuses

-   Available
-   Locked
-   Accepted
-   In Progress
-   On Hold
-   Completed
-   Abandoned

Overdue should be a **condition**, not a permanent status.

## 8.3 Difficulty

-   Novice
-   Intermediate
-   Experienced
-   Master
-   Grandmaster

Difficulty determines default rewards but can be adjusted through Game
Balance settings.

Once accepted, reward values are snapshotted to prevent changing
difficulty immediately before completion.

## 8.4 Target date vs deadline

**Target Date** = when the user intends to finish.

**Deadline** = when it truly must be finished.

Missing the target date does not count as missing the deadline.

This distinction must exist throughout the data model and UI.

## 8.5 Main vs Side

Questly may designate active quests as: - Main Quest - Side Quest

Maximum recommended simultaneous Main Quests: **3**.

This is a prioritization mechanism, not a separate quest entity type.

## 8.6 Current step

The primary quest experience should emphasize:

**Current Step**

rather than dumping every objective onto the user.

Full objective lists remain available in Active Quest / edit views.

------------------------------------------------------------------------

# 9. Quest Creation

There are two distinct experiences.

## 9.1 Quest Board

The Quest Board contains: - templates; - suggested quests; - reusable
adventures; - future system-generated recommendations.

Selecting a quest shows: - story/flavor text; - requirements; -
difficulty; - skill; - objectives; - rewards; - Accept Quest CTA.

## 9.2 Create Quest

Used to author a new real-life quest.

Primary fields: 1. Quest name 2. Description / flavor 3. Skill 4.
Difficulty 5. Target date 6. Hard deadline (optional)

Objectives are optional but strongly supported.

Advanced: - questline; - requirements; - recurrence; - effort
estimate; - Boss designation; - custom artwork; - notes.

Rewards are automatically calculated from difficulty and shown before
acceptance.

Primary CTA:

**CREATE & ACCEPT QUEST**

Do not make reward selection arbitrary by default. Rewards should derive
from game rules to prevent self-cheesing.

------------------------------------------------------------------------

# 10. Questlines

Questlines represent larger projects or arcs.

They should visually behave like dependency trees / adventure paths
rather than project folders.

Example:

Brand → Storefront → First Product → Launch\
                 ↘ Payment Setup ↗

Questline fields: - title; - description; - artwork; - quests; -
dependencies; - completion percentage; - questline reward; - trophy; -
status.

Locked quests show unmet requirements.

Possible requirements: - another quest completed; - skill level; - Quest
Points; - Collection Log item; - date; - manually defined requirement.

Questline completion can award: - bonus XP; - GP; - trophy; - Collection
Log item.

------------------------------------------------------------------------

# 11. Active Quest Screen

Opening an accepted quest shows:

### Hero

-   artwork;
-   title;
-   skill;
-   difficulty;
-   target/deadline;
-   progress;
-   current step.

### Quest Journal

Narrative framing such as:

> The footage has been recorded. Prepare the thumbnail before publishing
> the video.

Previous completed steps may appear crossed out.

Future steps may optionally remain obscured for game feel.

### Full management area

-   objectives;
-   notes;
-   activity;
-   dates;
-   status;
-   rewards.

Primary CTA:

**CONTINUE QUEST**

This launches Focus Mode on the current objective.

------------------------------------------------------------------------

# 12. Focus / Adventure Mode

Focus Mode is where actual execution happens.

It should feel like entering an encounter.

## 12.1 Behavior

When entered: - normal navigation becomes visually minimized; - current
quest dominates; - current objective is prominent; - unrelated quests
disappear; - timer becomes available; - optional ambient sound
setting; - notifications can be suppressed in-app; - objective
completion produces a subtle XP-style drop.

## 12.2 Timer presets

Default: - 25 minutes - 50 minutes - 90 minutes

Custom durations may be added.

## 12.3 Focus XP

Suggested initial model:

-   30-minute qualifying session: 25 Focus XP
-   60-minute qualifying session: 60 Focus XP
-   90-minute qualifying session: 100 Focus XP

Implement daily diminishing returns or a configurable daily cap so the
optimal strategy is not endless timer farming.

Focus XP values belong in Game Balance settings.

------------------------------------------------------------------------

# 13. Bosses

Bosses represent the user's biggest current challenges.

Only **one Current Boss** should be emphasized at a time.

A Boss can be: - a Master/Grandmaster quest; - a major questline
milestone; - a manually promoted major quest.

Boss display: - artwork; - name; - HP/progress; - target date; - hard
deadline; - remaining phases/objectives; - bounty; - rewards.

Progress reduces Boss HP.

## 13.1 Boss Bounty

Optional bonus for timely completion.

Example: - early: +30 GP - by target: +20 GP - by deadline: +10 GP -
late: +0 bonus

Normal quest rewards remain available even if bounty expires.

------------------------------------------------------------------------

# 14. Achievement Diaries

Achievement Diaries represent broader sets of accomplishments.

Tiers: - Easy - Medium - Hard - Elite

A diary can represent: - a period; - a domain; - a season; - a custom
adventure region/category.

For V1, support **Weekly** and **Monthly** Diaries.

## 14.1 Diary entries

Entries can be:

### Manual

Example: - Finish landscaping project.

### Auto-tracked

Examples: - complete 4 Creator quests; - finish 5 Focus sessions; -
defeat 1 Boss; - earn 5,000 Creator XP; - miss 0 hard deadlines.

## 14.2 Tier rewards

Completing a tier may award: - GP; - bonus XP; - Streak Shield; -
title/cosmetic; - Collection Log item.

Higher-tier rewards require lower-tier completion before claiming.

------------------------------------------------------------------------

# 15. Combat Achievements

Combat Achievements measure **execution mastery**, not ordinary
accomplishments.

Tiers: 1. Easy 2. Medium 3. Hard 4. Elite 5. Master 6. Grandmaster

They award **Combat Points**.

Examples: - Locked In --- complete a qualifying deep-work session. - No
Zero Days --- complete a meaningful quest action on 7 planned
workdays. - Ahead of Schedule --- complete a quest before target date. -
Deadline Destroyer --- complete 10 deadline-bearing quests on time. -
Boss Hunter --- defeat 10 Bosses. - Perfect Week --- meet a defined
weekly execution condition. - Unstoppable --- complete 25 Combat
Achievements. - Grandmaster challenge --- maintain an exceptional
long-term execution record.

Combat Achievements should generally auto-track.

## 15.1 Combat Points

Combat Points: - are permanent; - unlock tier rewards/cosmetics; -
contribute to profile prestige; - never function as spendable currency.

------------------------------------------------------------------------

# 16. Collection Log

The Collection Log is a permanent museum of meaningful accomplishments.

It is **not analytics**.

Primary UI: - category tabs; - grid of collectible slots; - unlocked
artwork/icons; - locked silhouettes; - secret `???` slots; - completion
count and percentage.

## 16.1 V1 categories

-   Creator
-   Business
-   Finance
-   Fitness
-   Home
-   General / Adventure

Avoid a gamified Family category in V1.

## 16.2 Collection item examples

-   First Quest
-   First Master Quest
-   First Boss Defeated
-   First Product Launched
-   100K Video
-   1M Video
-   \$10K Month
-   100 Quest Points
-   Skill Level 50
-   Skill Level 99
-   Questline Trophy
-   rare hidden achievement

Collection items may include: - icon/artwork; - title; - description; -
rarity; - unlock date; - optional memory/photo; - associated
quest/achievement.

## 16.3 Secret drops

Some items should display only as:

**???**

until unlocked.

------------------------------------------------------------------------

# 17. Character Profile

The Character Profile is the permanent account summary.

Sections: - character/avatar; - Total Level; - skill grid; - equipped
title; - equipped cape; - Quest Points; - Combat Points; - GP; - Diary
completion; - Collection completion; - significant achievements; -
lifetime stats; - level milestones; - current questline; - Current
Boss; - recent Collection items.

Avoid generic analytics charts unless they directly reinforce character
progression.

------------------------------------------------------------------------

# 18. World Screen

The World screen is the default login destination.

It should answer:

> What am I currently pursuing?

It should **not** begin with a giant task list.

Primary components:

### Character summary

-   avatar;
-   Total Level;
-   skills;
-   QP;
-   GP;
-   Combat Points.

### Current Adventure

The most important active quest/questline.

Show: - narrative state; - current step; - requirements/progress; -
Continue Adventure.

### Current Boss

Compact but visually important.

### Progress hooks

A few selected hooks: - next skill level; - tracked Combat
Achievement; - current Diary tier; - next Collection milestone.

### Recent event feed

Examples: - Creator reached 82. - New Collection item obtained. - Quest
completed. - Boss bounty started.

Do not turn World into a productivity KPI dashboard.

------------------------------------------------------------------------

# 19. Weekly Planning / Adventure Setup

Planning should feel like preparing an expedition.

The system gathers: - active quests; - upcoming hard deadlines; - target
dates; - Current Boss; - Monthly Diary progress; - recurring
commitments; - unfinished important work.

Flow:

### Step 1 --- Previous week recap

Show accomplishments and rewards.

### Step 2 --- Road Ahead

Surface real deadlines and major active quests.

### Step 3 --- Choose Battles

Select up to 3 Main Quests.

### Step 4 --- Weekly Diary

Generate or manually select relevant Diary achievements.

### Step 5 --- Rough allocation

Optionally associate quest steps with days.

This is not intended to become minute-by-minute calendar planning.

### Step 6 --- Begin Adventure

Confirm the week.

Questly may then recommend the most relevant next quest each day.

------------------------------------------------------------------------

# 20. Streaks

V1 streaks:

### Adventure Streak

Consecutive planned workdays with meaningful progress.

### Deadline Streak

Consecutive deadline-bearing quests completed on time.

### Focus Streak

Consecutive planned workdays with a qualifying Focus session.

Rules: - non-workdays do not break streaks; - vacation/pause mode
protects applicable streaks; - personal best remains visible after a
streak ends; - Deadline Streak cannot be protected with a Streak Shield.

------------------------------------------------------------------------

# 21. Streak Shields

Users can earn limited Streak Shields through meaningful accomplishments
such as Diary tiers.

They may protect: - Adventure Streak; - Focus Streak.

They may not protect: - Deadline Streak; - failed Boss bounties; -
actual missed hard deadlines.

------------------------------------------------------------------------

# 22. Overdue Handling

Do not create a giant red overdue counter.

Instead show:

**Quests Need Attention**

Each overdue quest requires a decision:

### Continue

Keep the quest and establish a new target.

### Rescope

Modify objectives/scope.

### Abandon

Archive it without rewards.

Original deadlines and history remain stored.

------------------------------------------------------------------------

# 23. Respawn / Recovery

Respawn activates when: - user manually requests a reset; or -
configurable inactivity/overdue thresholds are reached.

Suggested initial trigger: - 3+ missed planned workdays; or - 5+ quests
requiring attention.

Do not automatically force Respawn without allowing dismissal.

## 23.1 Respawn principles

Display:

**YOU DIED**

but immediately reinforce:

**Nothing permanent was lost.**

Never remove: - XP; - levels; - GP already earned; - QP; - Combat
Points; - achievements; - Collection items.

## 23.2 Guided Respawn

1.  Review affected quests.
2.  Decide Continue / Rescope / Abandon.
3.  Reset realistic target dates.
4.  Choose **one Respawn Quest**.
5.  Temporarily reduce recommended workload.
6.  Re-enter the World.

Completing the Respawn Quest may award a small Focus XP comeback bonus.

Track: - Deaths - Respawns

The statistic should communicate resilience rather than punishment.

------------------------------------------------------------------------

# 24. Celebration Layer

Meaningful accomplishments must feel meaningfully different from
checking a box.

## 24.1 Quest Complete

Full-screen or large modal: - Quest Complete! - quest artwork; - XP
earned; - GP earned; - QP earned; - Collection drop; - newly unlocked
quests; - Continue.

## 24.2 Level Up

Show: - skill; - old level; - new level; - new unlocks.

## 24.3 Collection Drop

Show: - item artwork; - rarity; - Collection completion update.

## 24.4 Combat Achievement

Show: - achievement; - tier; - Combat Points; - next tier/reward
progress.

Celebrations should be satisfying but fast.

Users must be able to dismiss them immediately.

------------------------------------------------------------------------

# 25. Notifications

V1 notification types: - upcoming hard deadline; - target date; - weekly
planning reminder; - quest requirement unlocked; - reward available; -
optional Focus reminder.

Avoid nagging.

Do not repeatedly notify users about the same overdue item.

------------------------------------------------------------------------

# 26. Settings / Game Rules

Settings sections:

## Profile

-   display name;
-   avatar;
-   title;
-   cape;
-   banner.

## Schedule

-   active workdays;
-   week start;
-   weekly planning day;
-   vacation/pause.

## Focus

-   timer defaults;
-   Focus XP cap;
-   ambient sound preference.

## Notifications

-   deadline reminders;
-   weekly review;
-   unlocks;
-   achievements.

## Appearance

-   theme;
-   accent;
-   wallpaper/banner;
-   reduced motion.

## Game Balance --- Advanced

This section should be intentionally less prominent.

Editable: - difficulty XP; - difficulty GP; - difficulty QP; - Focus XP
values; - Respawn thresholds; - Main Quest cap; - bounty defaults.

Display warning:

> Changing game balance can make progression less meaningful. Existing
> accepted quest rewards will not be retroactively changed.

------------------------------------------------------------------------

# 27. Anti-Cheese Rules

V1 must implement:

1.  No completion rewards for abandoned quests.
2.  Accepted quest reward values are snapshotted.
3.  Objectives do not independently multiply quest rewards.
4.  Deleting/recreating quests cannot duplicate completion rewards.
5.  Focus XP has configurable diminishing returns/cap.
6.  GP cannot be manually increased from ordinary UI.
7.  Completed achievements cannot be repeatedly claimed unless
    explicitly repeatable.
8.  Questline completion rewards claim once.
9.  Collection unlocks claim once.
10. Historical completion data remains immutable enough to preserve
    meaningful stats.

This is a personal system, not anti-fraud software. The goal is simply
to remove obvious temptation to game the game.

------------------------------------------------------------------------

# 28. Suggested Data Model

Exact database implementation is up to engineering, but V1 should
support these entities.

## User

-   id
-   display_name
-   created_at
-   settings
-   avatar_config
-   equipped_title_id
-   equipped_cape_id
-   gp_balance
-   lifetime_gp_earned
-   lifetime_gp_spent

## Skill

-   id
-   key
-   name
-   description
-   icon

## UserSkill

-   user_id
-   skill_id
-   xp
-   level

## Quest

-   id
-   user_id
-   title
-   description
-   skill_id
-   difficulty
-   status
-   priority_type
-   target_date
-   deadline
-   accepted_at
-   completed_at
-   abandoned_at
-   questline_id
-   is_boss
-   artwork
-   notes
-   reward_xp
-   reward_gp
-   reward_qp
-   current_objective_id

## QuestObjective

-   id
-   quest_id
-   title
-   description
-   position
-   status
-   completed_at
-   target_date
-   estimated_minutes

## QuestRequirement

-   id
-   quest_id
-   requirement_type
-   requirement_reference
-   required_value
-   is_met

## Questline

-   id
-   user_id
-   title
-   description
-   artwork
-   status
-   reward_xp
-   reward_gp
-   collection_item_id

## QuestDependency

-   parent_quest_id
-   child_quest_id

## Boss

May be represented through Quest.is_boss plus: - hp_model - bounty
configuration - bounty state

## Achievement

-   id
-   category
-   tier
-   title
-   description
-   tracking_rule
-   combat_points
-   repeatable

## UserAchievement

-   user_id
-   achievement_id
-   progress
-   completed_at
-   claimed_at

## Diary

-   id
-   user_id
-   period_type
-   start_date
-   end_date
-   status

## DiaryEntry

-   id
-   diary_id
-   tier
-   title
-   tracking_rule
-   progress
-   target
-   completed_at

## CollectionItem

-   id
-   category
-   title
-   description
-   rarity
-   secret
-   artwork
-   unlock_rule

## UserCollectionItem

-   user_id
-   collection_item_id
-   unlocked_at
-   associated_entity_id
-   note
-   memory_image

## Reward

-   id
-   user_id
-   name
-   description
-   category
-   gp_cost
-   repeatable
-   active
-   image

## RewardRedemption

-   id
-   reward_id
-   user_id
-   gp_cost_snapshot
-   redeemed_at

## FocusSession

-   id
-   user_id
-   quest_id
-   objective_id
-   started_at
-   ended_at
-   qualifying_minutes
-   focus_xp_awarded

## CurrencyTransaction

-   id
-   user_id
-   currency_type
-   amount
-   source_type
-   source_id
-   created_at

## ActivityEvent

-   id
-   user_id
-   type
-   entity_id
-   payload
-   created_at

------------------------------------------------------------------------

# 29. V1 Screen Inventory

Required V1 screens:

1.  **World**
2.  **Quests / Quest Board**
3.  **Create Quest**
4.  **Active Quest**
5.  **Questlines**
6.  **Skills**
7.  **Achievement Diaries**
8.  **Combat Achievements**
9.  **Bosses**
10. **Collection Log**
11. **Reward Shop**
12. **Character Profile**
13. **Focus Mode**
14. **Weekly Planning**
15. **Respawn**
16. **Settings**

Required overlays/states: - Accept Quest - Quest Complete - Level Up -
Collection Drop - Combat Achievement Complete - Reward Redeemed -
Requirement Unlocked - Quests Need Attention

------------------------------------------------------------------------

# 30. V1 Scope Boundaries

The following should **not** be required for initial V1 unless
implementation is trivial.

## Defer

-   multiplayer;
-   friends/social feeds;
-   leaderboards;
-   clans;
-   shared quests;
-   mobile native app;
-   calendar-provider integrations;
-   email integrations;
-   bank integrations;
-   automatic revenue tracking;
-   wearable integrations;
-   AI autonomous scheduling;
-   procedural quest generation;
-   public marketplace;
-   purchasable virtual currency;
-   microtransactions;
-   elaborate avatar equipment system;
-   hundreds of skills;
-   real-time collaboration;
-   complex habit tracker;
-   full document editor;
-   kanban boards;
-   Gantt charts;
-   dependency-management UI beyond questlines;
-   separate CRM/project-management modules.

If a proposed feature makes Questly look more like Jira, Notion,
Todoist, Asana, or a generic habit tracker, challenge whether it belongs
in V1.

------------------------------------------------------------------------

# 31. Seed Content

V1 should ship with enough seed data to feel like a game immediately.

## Combat Achievements

At least: - 8 Easy - 8 Medium - 8 Hard - 6 Elite - 4 Master - 2
Grandmaster

## Collection Log

At least 40 slots across V1 categories, including secret slots.

## Quest templates

At least: - Publish a YouTube Video - Launch a Digital Product -
Complete a Home Project - Complete Tax Documents - Finish a Workout
Goal - Monthly Financial Review - Deep Work Sprint - Custom Quest

## Reward templates

Examples only; user can edit/remove: - 1 Hour Guilt-Free Gaming - Gaming
Afternoon - Nice Dinner - New Game - Hobby Purchase - Tech Upgrade -
Weekend Experience - Custom Reward

## Titles

Seed: - Adventurer - Quest Seeker - Goal Slayer - Boss Hunter - Master
Creator - Merchant - Completionist

------------------------------------------------------------------------

# 32. Empty States

Empty states should reinforce adventure rather than absence.

Examples:

### No quests

> Your Quest Journal is empty.\
> Every adventure starts somewhere.

**Create Your First Quest**

### No Boss

> No foe currently stands between you and your biggest goal.

**Choose a Boss**

### Empty Collection category

> Nothing discovered here yet.

### No rewards

> Your Reward Shop is empty. Add something worth fighting for.

------------------------------------------------------------------------

# 33. Interaction Language

Prefer: - Accept Quest - Continue Quest - Begin Adventure - Enter Boss
Fight - Claim Reward - View Requirements - Quest Complete - Abandon
Quest - Respawn - Collection Item Obtained - Requirement Met - New Quest
Available

Avoid: - Create task - Save project - Ticket - Issue - Sprint backlog -
Productivity score - Workflow status - Resource allocation

The system may internally use conventional engineering terminology, but
user-facing language should preserve the game world.

------------------------------------------------------------------------

# 34. Accessibility and Usability

The RPG presentation must not damage usability.

Requirements: - readable text sizes; - strong contrast; - keyboard
navigation; - visible focus states; - reduced-motion option; - icons
never carry essential meaning alone; - color is not the sole indicator
of difficulty/status; - responsive layouts; - destructive actions
require confirmation; - celebrations are skippable; - timers remain
usable with screen readers.

------------------------------------------------------------------------

# 35. Responsive Strategy

## Desktop

Primary V1 design target.

Persistent sidebar and multi-panel game UI.

## Tablet

Collapse secondary panels and preserve core quest information.

## Mobile web

Prioritize: - Current Adventure - Current Step - Focus Mode - Quick
Quest capture - quest completion - skill/GP feedback.

Do not attempt to reproduce every desktop panel simultaneously.

------------------------------------------------------------------------

# 36. Technical Behavior Requirements

Implementation stack is intentionally not dictated by this product spec.

Regardless of stack:

-   game rules must be centralized;
-   XP/level calculations must be deterministic;
-   reward transactions must be auditable;
-   completion events must be idempotent;
-   historical rewards must use snapshots;
-   derived stats should be recalculable;
-   database migrations should be versioned;
-   seed content should be separated from user content;
-   UI components should use a consistent design-token system;
-   user data should be exportable.

------------------------------------------------------------------------

# 37. V1 Success Test

Questly V1 succeeds if the user can:

1.  Open the app and immediately feel like they are returning to a
    persistent RPG character.
2.  Understand what major adventure they are pursuing.
3.  Create a meaningful real-life goal as a Quest in under one minute.
4.  Break it into objectives without the interface becoming a task
    manager.
5.  Enter Focus Mode and work on one current step.
6.  Complete the Quest and receive satisfying progression.
7.  See XP affect a Skill and potentially trigger a Level Up.
8.  Earn GP and redeem a personally meaningful Reward.
9.  Progress a Diary or Combat Achievement automatically.
10. Unlock a Collection Log item.
11. Build a Questline with gated progression.
12. Designate a major challenge as a Boss.
13. Fall behind and recover through Respawn without losing permanent
    progress.
14. Return weeks later and see an account that meaningfully reflects
    accumulated accomplishments.

------------------------------------------------------------------------

# 38. Canonical Product Rules

These rules resolve conflicts between earlier concepts/mockups.

1.  **Six V1 skills only:** Creator, Business, Finance, Fitness, Home,
    Focus.
2.  Family is not a skill.
3.  "Productivity" is not a separate skill; Focus covers execution.
4.  Quest objectives do not independently create unlimited XP.
5.  Quests are the primary XP unit.
6.  Combat Achievements use Easy → Medium → Hard → Elite → Master →
    Grandmaster.
7.  Achievement Diaries use Easy → Medium → Hard → Elite.
8.  GP is never lost for failure.
9.  XP/levels are never lost for failure.
10. Hard deadlines and target dates are separate.
11. Maximum recommended Main Quests is 3.
12. One Current Boss is emphasized at a time.
13. World is character/adventure-first, not task-first.
14. Collection Log is collectible-slot-first, not analytics-first.
15. Focus Mode hides unrelated work.
16. Respawn is recovery, not punishment.
17. Reward Shop is optional motivation, not permission for normal life.
18. Accepted quest rewards are snapshotted.
19. The game metaphor should remain intact in user-facing copy.
20. When mockup imagery conflicts with this document, **this document
    wins behaviorally**.

------------------------------------------------------------------------

# 39. Build Order

Claude Code should not attempt every system simultaneously.

## Phase 1 --- Foundation

-   project setup;
-   database;
-   design tokens;
-   application shell;
-   navigation;
-   seed user;
-   six skills;
-   XP/level engine;
-   GP/QP transaction engine.

## Phase 2 --- Core Quest Loop

-   World;
-   Quest Board;
-   Create Quest;
-   Active Quest;
-   objectives;
-   quest completion;
-   XP/GP/QP rewards;
-   celebration overlays;
-   character progression.

At the end of Phase 2, the core loop must already be fun.

## Phase 3 --- Focus + Questlines

-   Focus Mode;
-   Focus sessions;
-   Questlines;
-   requirements/dependencies;
-   locked quests;
-   Boss designation and progress.

## Phase 4 --- Meta Progression

-   Skills screen;
-   Achievement Diaries;
-   Combat Achievements;
-   Collection Log;
-   Character Profile.

## Phase 5 --- Rewards + Recovery

-   Reward Shop;
-   GP redemption;
-   weekly planning;
-   streaks;
-   overdue review;
-   Respawn.

## Phase 6 --- Polish

-   responsive layouts;
-   animations;
-   sounds if desired;
-   accessibility;
-   empty states;
-   seed content;
-   data export;
-   performance cleanup.

------------------------------------------------------------------------

# 40. Final Direction to Implementation Agent

Do not simplify Questly into a conventional productivity dashboard.

Do not treat the fantasy UI as a decorative skin applied after building
a task manager.

Build the **game loop first**:

> Choose adventure → perform meaningful work → complete quest → receive
> progression → unlock new possibilities → build a permanent account →
> choose the next adventure.

The user should eventually be able to look at their Questly account
after several years and feel that it represents a persistent record of
the things they built, finished, learned, and overcame.

That is the product.
