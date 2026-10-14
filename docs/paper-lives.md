# Paper Lives: a life story that writes itself on your TRMNL (D159)

Proposed 2026-10-13 for Barry's review and widened the same day at his request ("we have time to build out a proper large MVP, so lean towards yes for many features"). This is the full specification for the third TRMNL Games title, a text-first life simulator in the spirit of BitLife, paced for a desk display: one year of a life every few hours, passive events between, a decision now and then in the companion, and a finished life that becomes a keepsake. The MVP is deliberately large; [Versions after the MVP](#versions-after-the-mvp) names what waits. **Approved as D159 on 2026-10-14** (proposed as P43); built in the slices below, hidden in production until its own listing. L1 (content v1, the pure core, the validator and the harness) L2 (the backend), L3 (the device), L4 (the companion) and L5 (album, boards, achievements) are built: see the build sections at the end, [L1](#l1-build-2026-10-14) to [L5](#l5-build-2026-10-14).

Settled with Barry on 2026-10-13 before drafting: the name Paper Lives; a year that never waits on the player (a minimum length, then the player ages up, or the year closes itself with safe defaults); early childhood compressed; at most one decision a year; death as the payoff rather than a loss, with the next life as the deceased's child or a stranger; a warm and dry tone rather than BitLife's crime and prison; authored, deterministic content; the game to reuse the shared engine wherever it fits while staying distinct from the other two; and a large MVP with later versions defined.

The game reuses what [Idle Angler](idle-angler.md) lifted out of Desk Crawler: the quarter-hour tick, the pure seeded simulator, bounded cohort reads, receipted intents, achievements over counters, the hourly publication, immutable record boards, the TRMNL lifecycle with the `hidden`, `preview` and `live` status, push alerts, the weekly device code, follows (D143) and the two-level deletion boundary. Where this spec says "as Desk Crawler" or "as Idle Angler", the named document is the authority and Paper Lives inherits the rule unchanged.

## The idea in one paragraph

Every player has one life at a time. A character is born with a name, two traits, a family and four small stats, and the years pass on the desk whether or not anyone is watching: a year lasts at least two hours, and in it a few things happen on their own (a friend made, a cold caught, a raise, a letter, the dog getting out). Most years the character has one decision to make, offered on the device and taken in the companion; a decision left alone takes its gentle default when the year closes. When the player is around, they age the character up as soon as a year's minimum has passed; when they are not, the year closes by itself after eight hours. Lives end, mostly in old age, sometimes not. A finished life becomes a page in the album with its epitaph, its photos and the lines that mattered, joins the family tree, and goes on the longest-lives board; the next life begins as one of the character's children, with what the will left them, or as a stranger. An attentive player lives a life in about a week; an absent one in about a month. Nothing ever needs the player, and everything is better with them.

## How it is different from the other two games

| | Desk Crawler | Idle Angler | Paper Lives |
| --- | --- | --- | --- |
| Progress | A hero that levels for ever | A logbook that fills for months | Finite lives, then the next generation |
| The player's role | Gear, floors, stances, raids | Setup: water, bait, selling | Decisions, and the choice of when a year ends |
| Device | Pixel scene with a board | Pixel scene with the catch | A portrait and a dated story column, like a diary |
| Social | Boards, raids, meetings, friends | Per-water records, profile | The album, the family tree and public life pages; longest-lives and fortune boards; followed players' characters |
| Economy | Gold, shop, workbench | Coins, tackle | Money as one stat among five; a house, a will, an inheritance; no shop |
| Ending | Never | Never | Always, and that is the point |

## What a player sees

- **Device:** a 1-bit portrait of the character that changes with age, the name, age and pronoun-free status line ("Maud Okafor, 34, nurse, renting"), the two traits, the four stat bars and money, the newest story lines each marked with the age it happened at ("31: Took the night shift. Tired, but the rent is paid."), the year's recap line once a year has closed ("Age 33: a raise, a cold, a new friend"), and either the year's decision as a prompt with the companion QR code ("34: The clinic offers a transfer to the coast. Decide in the companion") or the time the year will close by itself. The full layout adds the seven-day Top 5 of longest lives with the player's own best. A finished life shows a memorial: the portrait in a frame, the dates, the epitaph, the generation ("Third of the Okafors") and "Start the next life in the companion" with the QR code.
- **Companion:** a Life page (portrait, traits, stats, the year card with its decision and the Age up button or its countdown, the year's recap, the recent story), a People page (family, partner, children, friends, the pet, each with a relationship meter and their own small history), a Work page (education, job, income, home, savings, the will from 60), the Album (every finished life as a card with its highlights, portraits by stage and the photos claimed with the weekly device code; the family tree across generations; followed players' current characters), Rankings (longest lives and fortunes, this week and all time), Achievements, and More (pause, public profile, help, delete Paper Lives progress). Settings and Account are shared.
- **Help page:** `/help/paper-lives` explains that years pass on their own, what the minimum and the close time are, that an untaken decision takes its default, that deaths are not failures, how the next life and the inheritance are chosen, what the four stats and the traits do, and what the boards measure.
- **Public profile and life pages:** the shared profile at `/profile/<public name>` lists Paper Lives when opted in (public by default, D144): the current character's name, age, job and traits, the number of lives lived, the longest life, the family tree and the album's finished lives, each linking to a public life page `/profile/<public name>/lives/<n>` with the portrait, dates, epitaph, highlights and photos. Public pages return the same not-found for missing, private and suspended names (D109).

No streaks, no daily login, no timers that punish, no money that goes negative without a way out, no deaths before the character's story has had a fair go (below). The only pressure is a decision prompt on the desk that the player may ignore.

## Rules

### The life and its starting state

| Field | Starting value / meaning |
| --- | --- |
| Name | A first name and surname drawn at birth from the content pools; the player may change the first name before the first year closes, under the Desk Crawler hero-name rules (2 to 16 characters, same allowlist and moderation). A child of a previous life keeps the surname |
| Pronouns | `they` by default; the player may choose `she`, `he` or `they` in the first year. Content lines are written with pronoun slots; the device status line avoids pronouns so the layout never depends on the choice |
| Age | 0 |
| Stage | `infant` |
| Traits | Two of sixteen (Curious, Stubborn, Bookish, Sunny, Shy, Restless, Thrifty, Generous, Hardy, Delicate, Tidy, Dreamy, Sharp, Gentle, Lucky, Loyal), drawn at birth from the `birth` stream, never the same pair as a parent's. A trait gates events and decisions and tilts one drift; it never changes |
| Stats | Health, Happiness, Smarts and Charm, each 0 to 100; drawn at birth around 50 with a spread (one stat high, one low, from the `birth` stream); a child of a previous life inherits a nudge from the parent's final stats (a fifth of the distance from 50) |
| Money | 0 (the `gold` field); an inherited life starts with what the will left |
| Job | none; `education` set to `school` at 6 |
| Home | `family` until the character leaves; then `renting` or `owned`; an inherited house starts the life `owned` |
| Hobby | none until a childhood or teen decision picks one of eight (drawing, football, piano, fishing, baking, chess, gardening, running) |
| Pet | none; one at a time, from six kinds (dog, cat, rabbit, budgie, tortoise, goldfish), each with a name, a lifespan band and a relationship meter |
| People | Two parents and, two times in five, one sibling, each with a name, role, age, relationship 0 to 100, `alive` and a bounded history of up to four lines |
| Generation | 1 for a stranger; the parent life's generation + 1 for a child |
| Status | `living`; also `paused`, `ended`, `pending` |
| Year | `age`, `yearStartedTick`, `yearElapsedTicks`, `season`, `pendingDecision?` (one at most), `recap` (the last closed year's summary) |
| First log | "Born on a [weekday] in [season]. [Parent] says you had a good set of lungs." |

Activation is TRMNL-exclusive as in Desk Crawler (D09): the life is pending until a verified saved installation of the Paper Lives plugin; another game's installation does not activate it. One current life per account, kept across uninstalls. A pending life has a name, traits and a family but no years.

### Status

`living` (years pass), `paused` (owner's choice, the year clock stops, no events), `ended` (a memorial until the next life starts) and `pending`. There is no resting, travelling or sleeping. Pausing is allowed at any age; the year's elapsed ticks are kept, so a year paused at tick 5 of 8 resumes at tick 5.

### Stages

| Stage | Ages | Year length | What the years are about |
| --- | --- | --- | --- |
| Infant | 0 to 5 | 1 tick each (compressed childhood) | Birth stat reveal, traits revealed one a year, one family line a year, no decisions |
| Child | 6 to 12 | normal | School, friends, a pet, a hobby; small decisions |
| Teen | 13 to 17 | normal | Exams, first job, first love; the first weighty decisions |
| Young adult | 18 to 29 | normal | Leaving home, study or work, partners, the first flat |
| Adult | 30 to 59 | normal | Career, children, a house, parents ageing |
| Senior | 60 and up | normal | Retirement, grandchildren, the will, health, the last chapters |

A normal year is at least 8 ticks (two hours) and at most 32 ticks (eight hours). The six infant years take six ticks, so the character is at school ninety minutes after activation and the desk has moved from the first refresh. The year's four seasons run across its minimum, two ticks each (spring, summer, autumn, winter), so every year reaches winter before it can be aged up, for the active and the absent alike. A year past its minimum is at its **year's end**: the season stays winter, events and ambient lines drop their season filter and draw from the whole stage table, and the device shows "The year is winding down" with the close time. An absent player's long years therefore read as varied as an active player's, and no player sees a year cut off in spring.

### The year

A year runs from `yearStartedTick` and is resolved by the pure core tick by tick, in this order:

1. **Clock.** `elapsed = tick − yearStartedTick` (less the paused ticks). If the stage is infant, every tick is a year boundary (step 6). Otherwise a year boundary comes when the player's `ageUp` intent is recorded and `elapsed ≥ 8`, or when `elapsed ≥ 32` with no intent.
2. **Passive event.** On a non-boundary tick, one `event` draw against the stage's event rate (22 to 25% a tick inside the minimum and 4% at the year's end, tuned so a normal year has two to four lines). Events already seen in this life are skipped until the stage's pool runs dry. An event is one row from the stage's table filtered by the character's state (traits, has a partner, has a job, a parent alive, the pet, the hobby, money band, stat bands, and the season until the year's end), weighted by rarity (common 700, uncommon 230, rare 60, remarkable 10 per thousand). It applies its authored effects (stat nudges of ±2 to ±10, money, a relationship change, a new person, a job change, a health hit, a pet event) and writes one line marked with the age. Events that mention a person draw them from the `people` stream.
3. **Mid-year decision.** A few events are decisions themselves ("A letter from the coast clinic"). If no decision is open, the event becomes the year's pending decision; if one is already open, the event's plain line is written instead and nothing is offered. At most one decision is open at a time.
4. **Quiet tick.** No event: every fourth quiet tick writes one ambient line from the `narrative` stream for the stage, the season (or the year's-end pool past the minimum) and a trait, so the desk never stays the same for more than an hour.
5. **Boundary (age up).** Resolve the open decision with the chosen option, or with its default when none was chosen. Apply the year's drift: income minus living cost into money; health moves a quarter of the way toward a target of 75 that holds until 35 and falls a little more each year after, faster past 60 (illness knocks health below the target and it recovers; Hardy and Tidy slow the fall, Delicate hastens it); happiness drifts toward the relationship average, the money band and the hobby (+2 a year with one); smarts and charm hold. Apply the yearly checks: schooling and exams at 11 and 17, job offers at 18 and when unemployed, a partner's own events (a proposal, a falling out, a reconciliation, a separation), ageing and deaths among people and the pet (a parent in their 70s and 80s, a dog at 12 to 15, from the `people` stream, each at most once a year), a child's birth when the decision or event says so, and a grandchild's arrival when a child is over 25 (a line and a people row, two in five years). Write the year's recap line from what happened.
6. **Mortality.** One `mortality` draw: the chance is zero under 18 unless health is at 0, then a floor (3 per thousand a year) rising with age (about 1% at 60, 4% at 75, 12% at 85, 30% at 95) and with low health; Lucky cuts the chance by two fifths up to age 80 and has no effect after. Health at 0 at any age is a death check that year with a cause tied to the last health event. Death ends the year with the cause, the epitaph, the will and the life summary, and moves the life to `ended`.
7. **New year.** Otherwise `age + 1`, a stage change where due with its line ("18: Off into the world.") and a stage portrait added to the album for free, the next year's `decision` draw (two years in three offer a decision at the year's start, from the stage table filtered as events are, with its own rarity weights), and `yearStartedTick = tick`.

Only boundary ticks change age; every other tick can only add a line and nudge a stat. A non-boundary tick writes at most one line (an event or an ambient line). A boundary tick writes at most three story lines, picked in priority order (a death, the decision's resolution, a birth or a death in the family, the stage change, then everything else), plus the recap line; whatever misses the three appears only in the recap and in the person's own history on the People page, so nothing that happened is lost and the device column never floods. No catch-up for missed ticks (as [simulation](simulation.md)): an outage lengthens a year in wall time, never shortens a life.

### Decisions

A decision has a prompt, two to four options, and a default. Each option has authored effects (stat changes, money, a relationship change, a person added, a job, home, hobby or pet change, a flag for later events) and a line that becomes the story when it resolves. Options can be gated by a trait, a stat floor or money, shown greyed with the reason so the player sees what the character could not do. Defaults are the gentle choice ("Stay where you are", "Say nothing", "Let it be"), never the worst outcome: a player who never opens the companion lives an ordinary life, not a punished one. About one decision in five is **major** (marriage, a child, a job change, a house, a move, a retirement, the will) and is marked on the device and eligible for the alert below.

`life.choose(decisionId, optionId)` records the choice on the life; the option resolves at the boundary (step 5), as Desk Crawler's narrative choices do (D79), through one pure resolver that serves both the chosen and the default path, clamped to what the character has, so neither path can apply twice. Choosing does not age up: a player can choose and then wait for events, or choose and age up at once. A choice is reversible until the boundary by choosing again.

`life.ageUp` records the intent and the core takes the boundary on the next tick at or after the minimum. It can be recorded at any time in the year, so a player who looks in before the minimum queues the year's end rather than coming back for it. One intent per year; a second call before the boundary is a receipted no-op. A decision lapses unresolved when the year moves past it: the person it was about died or left that role, or its conditions no longer hold. There is no way to shorten a year below the minimum, so a very active player still lives one life a week and a device refresh is never what moves the game.

### People and the pet

The life holds at most twelve people, in the document, each `{ id, name, role, born (age of the character when they appeared), relationship 0 to 100, alive, flags, history (up to 4 lines) }`. Roles: parent, sibling, partner, former partner, child, grandchild, friend, colleague. A thirteenth would-be person is folded into an existing friend or colleague by the event resolver (the line still reads, nobody is added). The dead stay in the list for the story (a parent's memory, a grave visited); events filter on `alive`. A partner needs the character at 16 or older and goes through dating, engaged and married by decisions and events; a separation is a gentle event or a decision and leaves a former partner in the list. A child needs a partner or an adoption decision at 20 or older; at most four children; grandchildren at most four.

Relationship meters move by events and decisions and drift toward 50 by one a year; Loyal halves the drift. They gate events (a partner under 30 can leave; a child over 80 can visit in old age; a friend over 80 for twenty years earns a set-piece line) and feed the happiness drift.

The pet is one slot with its own kind, name, age and meter. A pet comes from a childhood decision or an adult event, lives its band, and its death is one gentle line and a candle glyph; a new pet can follow a year later. Pet events are a seventh of the common pool from child to senior, so a dog is in the story most years it is alive.

### Work and money

Thirty jobs in five tiers (paper round, dog walker, barista, shop assistant, nurse, electrician, plumber, teacher, librarian, journalist, software developer, architect, chef, surgeon, headteacher, novelist, pilot, vet and others), each with an income band, a smarts or charm floor, a stage and a trait that eases it. Education at 18 is a decision (university, a trade, straight to work) that sets which tiers are reachable; a second chance at 30 ("Night school") opens one tier. Promotion is a rare event; a sacking is a remarkable one; a career change is a major decision. Retirement is a decision from 60 and automatic at 70, with a pension at a third of the last income.

Money is yearly income minus the living cost (by stage and home) plus event amounts. It cannot go below a floor of −2,000 (debt): at the floor, the drift takes nothing more and a "tight year" line is written; an event ("A small inheritance") or a job pays it off. A house is a decision from 25 with money over its price (three bands: a flat, a terrace, a house with a garden); it stops rent, raises the living cost a little, adds a line of home events and passes on through the will.

### The will, death and the next life

From 60, one major decision offers the will: money split evenly among living children, all to one named child, to the partner, or to a cause (a remarkable line and a set-piece achievement, the next life starts with nothing). Without a will, the partner takes half and the children share half; with no family, the money goes with the character. The house goes with the money to the first named heir.

The cause of death comes from the catalog (sixteen causes, chosen by age band and the last health events: old age, a long illness, a sudden one, an accident, and four remarkable ones, each gentle). The epitaph is authored from the life's flags (the job held longest, the children, the house, the pet, the hobby, a remarkable event) by the `narrative` stream. The life summary keeps: name, pronouns, traits, generation, born and died ticks, age, cause, epitaph, final stats, peak money, job held longest, hobby, pets kept, children and grandchildren, the house, the will, the portraits by stage, and up to sixteen highlight lines (the major decisions and remarkable events, newest last). It is written once to `lifeRecords`, linked to the parent's record, and the life moves to `ended`.

The memorial stays on the desk until the player starts the next life with `life.begin(kind, personId?)`: `child` picks one of the deceased's living children (the oldest by default, or the player's choice), who keeps the surname, starts at the age they had at the parent's death with their relationship meters and the siblings, the generation + 1, and what the will left them (debt is forgiven); `stranger` starts at 0 with a new family and generation 1. A child who is already 60 or older is still allowed; the game just says so. The player can begin a stranger even when children exist. There is no automatic next life: a gravestone is not stale, and the choice belongs to the player.

### Determinism and versions

Per-life seed as [simulation](simulation.md): SHA-256 of `[worldSeed, lifeId, tick, simulationVersion, streamName]`, Mulberry32, six streams `birth`, `event`, `decision`, `people`, `mortality`, `narrative`. Paper Lives has its own simulation version (1) and content version (1) in its own package and never shares a catalog number with the other games. Replays of every past content version must stay identical.

## Content

Content v1 is authored by hand in `packages/paper-lives/src/content/v1.ts` and validated by a content validator like Desk Crawler's (ids stable, weights sum, every option has a line, every referenced flag and trait exists, every person-mentioning event has a role filter, every pronoun slot is filled for all three choices).

| Kind | Count at launch |
| --- | --- |
| Passive events | about 360 (60 a stage; infant has 12), including 48 pet events and 32 hobby events |
| Decisions | about 90 (15 a stage; infant has none), 18 of them major |
| Ambient lines | 96 (16 a stage, by season and trait), plus 30 year's-end lines (6 a normal stage) |
| Recap templates | 24 |
| Jobs | 30 in five tiers |
| Traits | 16 |
| Hobbies | 8; pets | 6 kinds |
| Causes of death | 16 |
| Epitaph templates | 36 |
| Name pools | 160 first names (not tied to pronouns), 100 surnames, 48 pet names |
| Portrait traits | 6 stage portraits × hair (6) × glasses (2) × an old-age hat or scarf; a pet drawn beside the portrait by kind |

Tone: warm, dry, concrete, in the register of a kind diary. Short lines (device lines under 90 code points, as Desk Crawler). Illnesses are named plainly and never graphically; there is no crime, prison, violence, weapons, drugs, gambling or sexual content; no real brands, companies, places or people; money is in plain numbers with no currency sign. Deaths are written gently and once. The content is the largest cost of the MVP: a life sees about 250 ticks with events, so 360 events across six stages keeps repeats within a single life rare and across generations expected, and traits, pets and hobbies make two lives with the same draws read differently.

## Leaderboards

Two record boards on the Idle Angler immutable-record path (`iaCatchRecords`, D116), from `lifeRecords` only, so a living character never ranks and nothing is scanned at a tick:

| Board | Measure | Windows |
| --- | --- | --- |
| Longest lives | Age at death, ties by the earlier death | This week (Monday 00:00 UTC) and all time |
| Fortunes | Peak money in the life | This week and all time |

Each shows a Top 100 with masked names as Desk Crawler and the player's own best row with its rank. The device's full layout shows this week's Top 5 longest lives with the player's own best. Published from the hourly generation with the achievement rarity, as [leaderboards](leaderboards.md) requires: Top 5, population and ranks from one publication.

## Achievements

A Paper Lives catalog, versioned and appended as [achievements](achievements.md) requires, with rarity from the game's own `achievementStats`. Launch families:

| Family | Counter | Tiers |
| --- | --- | --- |
| Lives | `livesEnded` | 1 / 3 / 10 / 25 / 100 |
| Years | `yearsLived` (lifetime, all lives) | 50 / 200 / 500 / 1,000 / 5,000 |
| Long life | `oldestAge` | 60 / 80 / 90 / 100 |
| Generations | `highestGeneration` | 2 / 3 / 5 / 8 / 12 |
| Family | `childrenRaised` | 1 / 3 / 10 / 25 |
| Grandparent | `grandchildren` | 1 / 5 / 15 |
| Vows | `marriages` | 1 / 3 / 10 |
| Careers | `jobsHeld` | 1 / 5 / 15 / 30 (all) |
| Fortune | `peakMoney` | 10,000 / 100,000 / 1,000,000 |
| Homeowner | `housesOwned` | 1 / 3 / 10 |
| Good company | `petsKept` | 1 / 5 / 15 |
| Pastimes | `hobbiesTaken` | 1 / 4 / 8 (all) |
| Traits | `traitsLived` (distinct) | 4 / 8 / 16 (all) |
| Decisions | `decisionsChosen` | 1 / 25 / 100 / 500 / 2,000 |
| Let it be | `decisionsDefaulted` | 10 / 100 / 500 |
| Remarkable | `remarkableEvents` | 1 / 5 / 25 / 100 |
| Photos | `photosClaimed` | 1 / 6 / 12 / 24 / 52 |
| Per job | `jobs[id]` | Held the job; held it for twenty years |
| Set pieces | flags | Every stat over 80 at 60; never left the family home; each remarkable cause; a will to a cause; a friend of sixty years; a dog that outlived its owner; a child who outlived three generations of the album; the oldest life on the all-time board |

The tier values are provisional. A child's life starts at the age they had when the parent died, so later generations are shorter and the pace of Lives, Generations, Careers and Years depends on the mix of child and stranger starts. The L1 harness sets every tier so the first tier of each counted family lands in the first life of an hourly player, and the top tier of the long-haul families (Lives, Years, Generations, Careers, Traits, Decisions) takes an hourly player about three months and stays reachable for a daily one within a year. "All" tiers (every job, hobby and trait) stay as written.

About 130 ids. Names and one-line descriptions are written with the content in the diary register. Platform achievements (Regular, Collector) count Paper Lives like any game.

## Device

The screen route is per game (`/trmnl/paper-lives/screen`), with its own payload version and templates. There is no painted scene: the device is a portrait and a diary column, which is the visual difference from the other two games and keeps the art budget small.

| Layout | Must retain | Simplification order |
| --- | --- | --- |
| Full | Portrait with the pet, name, age and status line, traits, four stat bars and money, up to six story lines with ages, the recap line, the decision prompt or the year's close time, this week's Top 5 longest lives with own best, service warnings, companion QR in the corner; a memorial swaps the column for the framed portrait, dates, generation and epitaph with the QR | Board → older lines → recap → traits → money → portrait size |
| Half horizontal | Portrait, name and age, newest two lines, decision prompt or close time, QR and warnings | Second line → stat bars → portrait |
| Half vertical | Name and age, portrait, newest three lines, decision prompt, QR and warnings | Older lines → stats → portrait |
| Quadrant | Name and age, newest line or the decision prompt, QR and warnings | Portrait first; no stats |

The portrait is a 1-bit stage portrait with the trait layers and the pet, drawn by the shared art primitives in `packages/engine/src/art/` at the slot's width as D125 does. The weekly device code sits in the title bar as the other games' codes do. Times for the year's close use the D42 `utc_offset` rule (24-hour HH:MM, no zone label, omitted without an offset). Four layouts on OG and four on X through the preview sweep are the layout gate, as every game.

## Companion

Routes under `/app/paper-lives`: Life, People, Work, Album, Rankings, Achievements, More; Settings and Account shared; the game switcher lists three games. The Life page's year card shows the age, the season, the open decision with its options (gated ones greyed with the reason) and **Age up** with a one-line note of what resolves (before the minimum it reads "Age up at HH:MM" and queues the year's end), beside "Closes by itself at HH:MM"; choosing an option asks nothing further. The portrait is painted in colour from the same traits, as the other games paint their scenes (D120). The People page lists each person with their meter and history, the pet with its age, and the deceased under a rule. The Work page shows education, the job and its tier, income and living cost as labelled rows, the home, and the will once made. The Album lists finished lives newest first as cards (portrait by stage, name, dates, epitaph, highlights, photos), the family tree as an indented list of records by generation with each life's dates, and a Following card (D143) with the current character of each followed player (name, age, job) linking to their profile. Mobile first at 390 wide; empty, pending, paused, ended, disconnected and error states follow [companion](companion.md). Help at `/help/paper-lives`, public game page at `/games/paper-lives`.

## Staying on the TRMNL: the photo album

The D46 keepsake machinery with a life skin: the device title bar shows a weekly six-digit code, never in the companion preview. Claiming it in the companion takes a **photo** of the current character at their current age (the portrait with the pet and a date caption) into the album, one per account per week, with the cached-screen grace, no missed-week penalty and no effect on play. Photos outlive the life they were taken in and sit with that life's card in the album and on its public page; a family across generations ends up with a shelf of them. Stage portraits are added to the album for free, so the code photos are the ones between (a 23-year-old with the first dog). The device stays the better view by composition: the diary column with ages, the recap and the decision prompt are drawn for the screen, and the companion is where the decision is taken, not where the story is read first.

## Alerts

Three opt-in kinds under the D114 machinery, off by default, with the shared quiet hours, the two-a-day cap and device rules: `major_decision` (sent when a major decision is offered and the year's minimum has passed, once per decision, held through quiet hours and dropped if the year has closed by then), `life_ended` (sent at the memorial, once per life, held through quiet hours) and `new_arrival` (a child or grandchild born, sent at once, dropped in quiet hours). Ordinary decisions never alert.

## Analytics

Consent-gated, as the other games: `paper lives started` (server, per life, with `kind`), `decision chosen` (major or not), `aged up` (with the elapsed ticks band), `life ended` (age band, cause), `next life started` (kind), `album viewed`, `life page viewed` (public), `rankings viewed`, plus the shared alert, follow and profile events. No per-tick events.

## Data

New tables prefixed `pl`, as Idle Angler's `ia`. Shared tables gain the game where they already carry a slug.

- `paperLivesProfiles` `{ userId, lifeId }`, one per user.
- `lives`: owner, name, pronouns, traits (2), generation, age, stage, season, status, stats, gold, education, job, jobSince, home, hobby, pet?, people (at most 12), flags (a bounded set of string ids, at most 48), pendingDecision?, ageUpRequested?, yearStartedTick, yearElapsedTicks, recap, will?, counters, publicProfile, activation fields, lastTick, eligibleFromTick, createdAt. Indexes `by_owner`, `by_createdAt`. The ended life stays the current row until `life.begin` replaces it in place (same id, new life fields, `previousLifeRecordId`), so the profile pointer never changes.
- `lifeRecords`: the finished-life summary above with `parentRecordId?` and `ordinal` (the account's nth life); indexes `by_owner_and_endedAt`, `by_owner_and_ordinal`. One row per life, written once; bounded per account by time (a life takes a week at least).
- `plLifeBoards`: the two record boards' inputs (owner, recordId, age, peakMoney, endedAt, week), the `iaCatchRecords` shape; written once at death.
- `plPhotos`: owner, lifeRecordId? (set when that life ends), name, age, traits, pet, week; index `by_owner`. One a week, plus the free stage portraits as rows with `week` unset (at most six per life).
- `plTickLogs`, `plWorldState`, `plSimulationRuns`, `plSimulationFailures`, `plLeaderboardPublications`, `plAchievements`, `plAchievementStats`: the engine shapes with `heroId` read as the life id (the S0 convention).
- Shared: `users` (plus a `paperLivesAlerts` block), the TRMNL tables (`gameSlug` widens), `follows` (already per account), `operationReceipts`, `rateLimitBuckets`, `pushSubscriptions`, `alertOutbox`, `gameDeletionJobs`, `platformGames`.

Deleting Paper Lives progress revokes its installations, denies its authority and purges the `pl` tables, the records, the boards' rows, the photos and the profile, leaving the account and the other games untouched; account deletion runs all three purges then the Clerk deletion. Public life pages of a deleted account are gone with the records.

## Architecture

- **Package** `packages/paper-lives` with `content`, `sim`, `art`, `templates` and `payload` subpath exports, pure and network-free.
- **Backend module** `apps/backend/convex/paperLives/` owning the `pl` tables, its crons, its screen route and its intents. Crons ten minutes into each quarter-hour (UTC minutes 10, 25, 40, 55), so the three worlds never tick in the same slot; its own watchdog, run guards and operations card.
- **Shared engine.** Everything Paper Lives needs from the engine already exists after Idle Angler's S0: the runner, publication, world singleton, the lifecycle hooks (`lib/gameHooks.ts`), the deletion jobs, the keepsake code minting, the record-board shape and follows. Paper Lives has no score windows; it writes empty ones as Idle Angler does, so it needs no engine change. Letting the publication skip windows for a game without them is a later tidy for both games and blocks nothing.
- **Registry.** `packages/platform` adds `paper-lives` to `games` and `GameSlug` with `defaultStatus: 'hidden'`; `clientIdEnv` is `TRMNL_CLIENT_ID_PAPER_LIVES`.
- **Lifecycle status.** `hidden` while built (admin-only routes, crons on an empty world), `preview` for the coming-soon tile once the portraits exist, `live` on marketplace approval, as Idle Angler.
- **Intents.** `life.choose`, `life.ageUp`, `life.rename` and `life.setPronouns` (first year only), `life.begin`, `life.pause`, `life.resume`, `life.setPublicProfile`, `photos.claim`, `connections.disconnect`; receipted, rate-limited and owner-checked under the [common intent contract](api.md#common-intent-contract). Follows reuse `follows.*`.

## TRMNL

A separate marketplace plugin with its own OAuth client, listing image, knowledge-base URL and install and manage routes under `/connect/trmnl/paper-lives/`; the same install → Save → activation → uninstall tombstone lifecycle. Refresh every 15 minutes offered as the fastest; nothing in the game depends on it. Submission is a separate authorized action after Idle Angler's listing, so the reviewer sees a platform with two live games.

## Art

Six stage portraits at one size with trait layers (hair, glasses, old-age hat or scarf), six pets drawn beside the portrait, a frame for the memorial, a camera glyph for photos, stat bar marks and a set of story glyphs (family, work, money, health, heart, paw, star for remarkable, a candle for a death, a ring, a house, a pram). All 1-bit and hand-authored on the engine's art primitives; the companion tones the same drawings in colour. Still about a fifth of Idle Angler's art count.

## Work slices

| Slice | Content | Gate |
| --- | --- | --- |
| L1 Core (built 2026-10-14) | Content v1 (events, decisions, jobs, traits, hobbies, pets, causes, names, lines, recap and epitaph templates), validator, pure core with six streams, starter, will and `begin` rules, harness `tools/balance/paperlives.ts` | Harness over 60 days for an hourly player, a daily player and a never-visiting one: median life 72 to 84 years; deaths under 18 below 2% of lives; an hourly player's life 5 to 9 days and a never-visiting one 24 to 32 days; a normal year writes 2 to 4 lines (p10 at least 1); no stage repeats an event within a life more than 10% of the time; money never below the floor; every decision's options each chosen by a uniform policy end within 15% of the same mean happiness at 60 (no dominant option); at least one remarkable event in 80% of lives; a pet in 70% of lives and a hobby in 80%; every trait changes at least one measured outcome by 5% or more and none by more than 25%; no boundary tick writes more than three story lines; achievement tiers set by the rule in Achievements |
| L2 Backend (built 2026-10-14) | `pl` tables, profile, tick, intents, screen route, payload v1, record boards, deletion paths | convex-test matrix: tick and boundary at the minimum and the close, choose then default, gated options, pause mid-year, death, the will and `begin` for both kinds, record and board rows written once, activation, duplicate receipts, both deletion levels |
| L3 Device (built 2026-10-14) | Portraits and pets, templates for four layouts on OG and X, the memorial state, the device board | Preview sweep clean in every state; no overflow; no text under a code |
| L4 Companion (built 2026-10-14) | Pages, help, game page, switcher, public life pages, the Following card, 390-wide states | Fixtures walkthrough at 390 wide; no overflow or console errors; life-page not-found parity |
| L5 Album, boards and badges (built 2026-10-14) | `lifeRecords`, the album and family tree, the two boards and the device Top 5, achievement catalog v1, the profile section | Record written once per life; boards read from one publication; rarity tallies; profile not-found parity |
| L6 Alerts, photos and analytics | Three alert kinds, the photo album on the D46 code, stage portraits, events, privacy wording | Alert tests by backend path; a real push on the dev keys |
| L7 Listing | OAuth client, listing image, submission (each an authorized action, Barry's) | Live install, render and uninstall on Barry's device |

Progress preservation applies from the first public install, as every release. L1 is the long pole: the content is written before anything else is worth building, and the harness decides every number above. L1 can start now; nothing in it touches the other games.

## Versions after the MVP

Each is a minor release on the roadmap's terms: additive schema and content under a new content version, old payloads and templates keep their meaning, progress preserved. The order is a proposal.

| Version | Theme | What it adds |
| --- | --- | --- |
| v1.1 Pen pals | Other people in your story | Followed players' characters appear as friends, colleagues or partners in each other's lives through the raid-pool pattern (D110, D141): a `penpal` stream picks one followed account's living character, both lives get the same event line from their side, and the person row carries the other player's public name and links to their profile. A Pen pals achievement family. Needs follows to be mutual or opt-in per game |
| v1.2 The calendar | The real year in the story | The office calendar's occasions (D139) reach Paper Lives on the player's local dates as event lines and one small effect (a birthday on the character's birth season, holidays with the family, a New Year's resolution decision); seasons tied to real-world months rather than the year's ticks; snow and sun on the portrait's frame |
| v1.3 Eras | When a life is set | A life is born into an era (1950s, 1970s, 1990s, today) drawn at birth or chosen for a stranger, with era-flavoured jobs, events and lines, and a child's life moves into the next era. Era achievements. Content only; no rule changes |
| v1.4 Challenges | Lives with a brief | Start conditions for a stranger (born into money, born with a trait pair, a hard winter), and a weekly **shared life**: everyone who starts it that week draws the same birth and the same events, so decisions alone make the lives differ; a board of that week's shared lives by age and happiness |
| v2.0 Dynasty | The family as the unit | The estate (a house, savings and heirlooms that pass down with the will and a family name's reputation), a family business a child can take over, a named town with places that persist across generations (the school, the clinic, the pub, the graveyard with every ancestor), playing as any living descendant including grandchildren, and a family-tree view across accounts for pen-pal marriages. The major: it changes what a life starts with |
| Later | Longer lives | A second language for the content, names from the player's own pool, more pets and hobbies, voice lines on the companion, cosmetic nods between games (a hero's cardigan in a wardrobe decision, a fishing hobby that reads Idle Angler's logbook) |

## Not in the MVP

- Everything in the versions table above.
- Playing as a grandchild directly (the child's life is the path to it), inherited heirlooms beyond the house and money, a town.
- Romance beyond partner, former partner and the dating, engaged and married steps; a second language; names drawn from the player's own.
- Shops, items, cosmetics beyond photos; any way to speed a year below its minimum.
- Crime, prison, violence, gambling, drugs, adult content: never.

## Decisions taken in this revision

Barry asked on 2026-10-13 for a large MVP with later versions defined, so the open points of the first draft are settled here toward yes.

1. **Year lengths stay at two and eight hours.** A four-hour close would default more decisions overnight for a two-week passive life; the week-long active life is the pace Barry asked for, and the close only matters to the absent.
2. **The first name is editable in the first year, and pronouns are chosen.** The Desk Crawler hero-name rules already carry the moderation; "my character" is worth the surface. Pronouns are a content slot, not a stat, and the device avoids them.
3. **Two record boards ship**, longest lives and fortunes, on the Idle Angler record path, so no tick scans anything and only finished lives rank.
4. **Traits, hobbies, pets, grandchildren, the will, the family tree, public life pages and the Following card are in the MVP.** Each is content and bounded document fields on the same tick order; none adds a stream beyond the six.
5. **Order.** L1 (content and core) starts whenever Barry says, in parallel with the rest of v2.0 Depth, since it touches nothing shared; L2 onward follows L1 with no engine change first (empty score windows, as Architecture says); the listing waits for Idle Angler's.

## Review fixes (2026-10-14)

Barry read the full spec on 2026-10-14 and asked for the problems found in that read to be fixed.

1. **Seasons run across the minimum**, two ticks each, so every year reaches winter before it can be aged up; past the minimum the year is at its year's end and content drops the season filter. Before, seasons were quarters of the eight-hour close, so an active player only ever saw spring.
2. **Line cap by tick kind.** A non-boundary tick writes at most one line; a boundary tick writes at most three story lines by priority plus the recap, and the rest goes to the recap and the People page. The old "at most two lines a tick" could not hold at a boundary.
3. **Lucky** halves the mortality chance up to age 80 and has no effect after (was "halves it to 80").
4. **No engine change before L2.** Paper Lives writes empty score windows as Idle Angler does; the order no longer waits on the tidy.
5. **Achievement tiers are provisional** and set by the L1 harness to stated pace targets, since child lives start mid-age and shorten later generations.

## L1 build (2026-10-14)

Built on main the day D159 was approved: `packages/paper-lives` (`sim` and `content` exports), content v1 with its validator (`content/validate.ts`), the harness `tools/balance/paper-lives.ts` (`pnpm balance:paper-lives`) and tests in `tests/paper-lives/`. Nothing outside the package changed beyond the workspace wiring; no backend, device or companion code yet (L2 onward).

**Content v1.** 421 passive events (12 infant, 61 child, 48 teen, 80 young adult, 126 adult and 108 senior, with the 14 pet events shared by adults and seniors counted in both), 48 of them pet events and 32 hobby events; 90 decisions (10 child, 12 teen, 20 young adult, 28 adult, 20 senior), 18 major, 6 opened only by an event and 2 forced (education at 18, night school at 30 without a degree); 96 ambient lines and 30 year's-end lines; 30 jobs, 16 traits, 8 hobbies, 6 pets, 16 causes (4 remarkable), 36 epitaphs, 159 first names, 100 surnames, 48 pet names. The validator checks ids, references, slots for all three pronoun choices, device lines under 90 code points once filled with the longest names, notes under 40, gendered words (people are always named), the banned themes and colon reveals. It reports no problems.

**Harness (1,800 lives, 600 per player, 60 days).** Every L1 gate passes:

| Gate | Result | Target |
| --- | --- | --- |
| Median life | 79 years (p10 54, p90 90) | 72 to 84 |
| Deaths under 18 | 0% | below 2% |
| Hourly player's life | 8.4 days | 5 to 9 |
| Never-visiting life | 24.7 days (daily player 24.5) | 24 to 32 |
| Story lines a normal year | mean 3.6, p10 1, p90 6 | 2 to 4, p10 at least 1 |
| Worst stage repeat rate | 6% (senior) | at most 10% |
| Lowest money | -2,000 | the floor |
| Widest option spread at 60 | 12% (start a family) | within 15% |
| Lives with a remarkable event, a pet, a hobby | 86%, 100%, 99% | 80%, 70%, 80% |
| Every trait moves an outcome 5 to 25% | all 16 | all |

Each trait clears 5% through what it is meant to do: Curious and Bookish smarts at 30 (+23%), Gentle charm at 30 (+22%), Thrifty, Generous, Sharp and Dreamy peak money (+15 to -20%), Hardy, Delicate and Tidy health at 60 (+9%, -10%, +5%), Stubborn and Lucky years past 70 (+17%, +19%), Shy the age of a first partner (+16%), Sunny and Restless happiness at 60 (+7%, -7%), Loyal happiness at 60 (+6%). Other stats: 95% of lives marry, 72% have children, 27% own a house, 55% of lives past 60 write a will, median peak money about 378,000.

**Changes from the spec, all from the harness or the first read of the stories.**

1. **Age up queues.** With Age up enabled only from the minimum, a player looking in on the hour usually arrived a tick short and every year took three hours: an hourly life ran 11.8 days. Age up can now be recorded at any time and the year ends at the first tick on or after the minimum, so no year is ever shorter. Hourly life 8.4 days.
2. **Health drifts toward a target.** A decline-only health stat ran most adults to zero by their forties (median life 43). Health now drifts toward a target that holds at 75 until 35 and falls each year after (-0.4 a year from 35, -0.8 from 50, -1.2 from 60, -1.8 from 70, -2.5 from 80); illness knocks it down and it recovers. Hardy (60%), Tidy (75%) and Delicate (150%) scale the fall.
3. **Rarity is per draw.** One draw picks the tier (700, 230, 60, 10 per thousand) among the tiers present, a second picks the event inside it, so the weights mean what the spec says rather than per row.
4. **A seen list.** Events and decisions already seen in a life are skipped until a stage's pool runs dry (the `seen` field, bounded by the content size), which is what holds repeats to 6%.
5. **Lucky** cuts mortality by two fifths until 80, not half: halving moved years past 70 by 28%, over the 25% cap. **Shy** also makes meeting events (the ones that add a partner) less likely, since most partners arrive through events rather than the yearly check; a first partner now comes 16% later. **Stubborn** lowers mortality by 30% from 70. **Sharp** earns 10% more, not 12%.
6. **The will has five options** (evenly to the children, to one child, to the partner, to a cause, and the default "Not this year"), one more than the two-to-four rule; every other decision has two to four.
7. **Births.** "Start a family?" has a gentle default that leaves the door open (a flag), and a couple open to children has a 30% chance a year from 22 to 44, so an absent player's life still has a family (72% of lives); grandchildren come at 25% a year once a child is over 25.
8. **People record when they were met** (`metAt`) as well as their age (`bornAt`), so "fifty years of friendship" needs fifty years. Anniversaries need the years married (`partnerYears`).
9. **A Saturday job ends at 18**, so adult life starts with the job offers rather than a paper round's wage.
10. **The recap names at most two things** ("Age 33: a raise and a new friend."), as the copy guide avoids three-item lists.
11. **No gambling or smoking in the content.** The first draft had a lottery, a raffle, a sweepstake and cigarettes; the validator now rejects them with the other banned themes.
12. **Line cap holds by construction**: a passive tick writes at most one line; a boundary at most three story lines by priority plus the recap, with the closing year's lines and recap before the new stage's line.

The tests cover the starter, rename and pronouns in the first year only, infant compression, the minimum and the close, the queued age-up, seasons, the line caps, pause, determinism, the forced education decision, choose and default, gated options with reasons, lapsing, the debt floor, mortality under 18 and Lucky's limit, the record written once, the will and its defaults, the child's next life, slot filling, the validator and the harness.

## L2 build (2026-10-14)

Built on main in two commits, bfe1a3c and 9c8b54a (the second went out with the first's message by mistake; its contents are the intents, the screen route and deletion). Production gains the hidden game: its crons tick an empty world ten minutes into each quarter-hour, and every route answers not-found for non-admins until an admin opens it.

- **Registry and lifecycle.** `paper-lives` is in `packages/platform` with `defaultStatus: 'hidden'` and `TRMNL_CLIENT_ID_PAPER_LIVES`. The TRMNL lifecycle, analytics, connections, receipts and the alert purge now go through game hooks for three games (`lib/gameHooks.ts`: `otherGameHooks`, `currentCharacterOf`, `gameDeletingFor`). Admin-only placeholder routes at `/app/paper-lives` and `/games/paper-lives` keep the game switcher typed until L4.
- **Tables.** `pl` engine tables; `paperLivesProfiles`; `lives`, with the pure core's state stored whole in `life` beside the engine fields and the account's `ordinal`; `plTickLogs` (story lines with their age and glyph, 72-hour retention like the other games' logs); `lifeRecords` (written once at death) and `plLifeBoards` (each player's best finished life per board, this week and all time, the `iaCatchRecords` shape).
- **Tick.** `paperLives/tick.ts` on the shared runner: a paused life or a memorial is skipped between publications, invariant errors quarantine, a death writes the record and both boards' rows once.
- **Intents and queries.** `paperLives/lives.ts`: choose, ageUp (queued), rename and setPronouns (first year, hero-name rules), pause, resume, setPublicProfile and begin (the oldest living child by default, a named child, or a stranger), each receipted and owner-checked; `view` returns the Life page (year card with the decision's options and gate reasons, people, work, memorial with heirs). A decision lapses unwritten when its person dies or leaves the role.
- **Device.** Payload v1 is a pure builder (`packages/paper-lives/src/payload.ts`): the status line without pronouns, the newest six lines of the current life, the recap, the decision prompt or the close time as epoch seconds for the D42 offset rule, the memorial, and this week's Top 5 longest lives. `/trmnl/paper-lives/v1/screen`, `/install/success` and `/uninstall` follow Idle Angler's authorization and lost-callback recovery. The markup is a plain-text placeholder (`templates/screen.ts`, template version 0) until L3 draws the layouts.
- **Deletion.** Deleting Paper Lives progress revokes its installations and purges lives, story lines, records, board rows and its receipts, leaving the account and the other games; account deletion purges the same and the profile.

Tests: 23 new in `tests/convex/paper-lives-*.test.ts` and `tests/paper-lives/payload.test.ts` (ticks at the minimum and the close, activation through Save and through the first screen request, choose and default, gated options, receipts, rename window, pause without catch-up, death and records written once, both kinds of next life, the screen's 404s and other games' tokens, uninstall, both deletion levels). The full suite passed at 873 tests before the push.

Next: L3, the device art and templates for four layouts on OG and X.

## L3 build (2026-10-14)

- **Art.** `packages/paper-lives/src/art/`: a head-and-shoulders figure per stage (a swaddled infant, a child, a teen in a hoodie, a collar for young adults, buttons for adults, a cardigan and grey hair for seniors) with six hair styles, glasses once a line gives them, a flat cap or a scarf in old age, the pet beside the figure by kind (dog, cat, rabbit, budgie on a perch, tortoise, goldfish bowl), and a double-rule frame for the memorial. The look comes from the surname, generation and traits, so it holds through a first-year rename. 8x8 marks for the thirteen story glyphs, the four stats, money, the board, the close time and the decision. Served at `/art/pl/portrait/v1/...` and `/art/pl/qr/v1/app/<scale>.png` (every part allowlisted); the code encodes the new `/pl` short link, which opens the companion and answers not-found while the game is hidden.
- **Templates.** Template v1 replaces the placeholder: the full layout is a card (portrait, name and age, the rest of the status line, traits, four stat bars as five half-step ticks, money), the diary column (the decision inverted, or the close time in the owner's offset; up to six lines with ages; the recap under a rule) and this week's longest lives with the code. A memorial swaps in the framed portrait, the generation and the epitaph. The half, side and quarter layouts keep what the Device table lists; the quarter has no portrait.
- **Payload v1 additions:** `portrait_base`, `qr_base`, `status_detail` (the status line without the name and age, which sit beside it), `traits_label`, `stat_rows`, `money_label`, `board.own_listed`.
- **Checks.** 264 previews (eleven states, four layouts, OG, X and BWRY, both orientations) pass the sweep; the official linter and the class check pass; liquidjs and Ruby Liquid render every scenario identically ([evidence](evidence/paper-lives-device.md)).

Next: L4, the companion pages, help and public game page in place of the placeholders.

## L4 build (2026-10-14)

- **Companion.** `/app/paper-lives` with four tabs, Life, People, Work and More, in place of the placeholder. Life: the portrait (drawn in the browser from the device's own art, in the page's ink; the colour toning waits), traits, the four stats as meters and money, the first-year card (rename under the hero-name rules, pronouns), the year card (season or the year's end, the decision with every option, greyed ones with their reason and the default marked, then Age up with when the year will end and when it would close by itself), last year's recap, the memorial with the epitaph and the next-life choice (each living child, oldest first, or a stranger), and the story so far without the quiet lines. People: each person with their meter and history, the pet, the dead under "Remembered". Work: education, job and tier, hobby, savings, income, living cost and the year's net, the home and the will. More: help, pause with a confirm sheet, the public profile switch and deleting Paper Lives progress.
- **Pages.** `/help/paper-lives` with the numbers from content v1, the public game page `/games/paper-lives`, the game switcher's Paper Lives line and the My games tile. Public life pages at `/profile/<alias>/lives/<n>` (`paperLives/public.ts`): the framed portrait, age, generation, epitaph, traits, the moments that mattered and links to the parent's and the next generation's pages, with the same not-found for a missing life, a hidden page, a suspended owner, a bad address and a game that is not live.
- **Core change.** Quiet lines no longer repeat within a year: each year walks its pool from its own starting point (`year.ambient`). The device showed the same quiet line twice in an absent player's long year. All 13 L1 gates still pass over 1,800 lives (at 900 the trait gate can miss on sampling noise).
- **Checks.** The phone harness (`tools/review/companion-fixtures.mjs`) serves the pages from fixtures written by the real backend (`PL_FIXTURES=1 npx vitest run tests/convex/paper-lives-fixtures.test.ts`) in ten states; at 390 wide every page has no horizontal overflow and no console errors. Backend tests cover the public page's parity.

Moved to L5 with the album: the Rankings and Achievements pages and the Following card (the spec puts it on the Album page). Next: L5, the album and family tree, the two boards and the device Top 5, achievement catalog v1 and the profile section.

## L5 build (2026-10-14)

- **Achievements.** Catalog v1 in `packages/paper-lives/src/content/achievements.ts`: 126 ids, the sixteen counted families (Photos waits for L6, with the photos), a held tier and a twenty-year tier for every adult job (one tier for the four Saturday jobs), and ten set pieces (all round at sixty, never left home, a will to a cause, a friend of sixty years, a dog that outlived its owner, the oldest life on the all-time board, and the four remarkable causes). The "child who outlived three generations" piece was dropped: nothing in the record can show it. Every predicate reads the account's career, the folded totals of its finished lives (on `paperLivesProfiles.career`, folded once with the record) plus the current life, so a second life picks up where the first left off. Lives track the hobbies they have had (`hobbiesHad`) for Pastimes.
- **Tiers changed from the spec.** The spec's long-haul tiers were out of reach: an hourly player finishes about one stranger's life in 8 days and a continuing child's in 3 to 5, so about 15 to 20 lives in three months. Lives is now 1, 3, 6, 12, 20 (was up to 100), Years 50, 150, 300, 600, 900 (was up to 5,000), Decisions 1, 25, 100, 250, 500 (was up to 2,000), Let it be 10, 100, 300, and Remarkable 1, 5, 15, 30. These come from the measured life lengths, not from a simulated account; the rest keep the spec's values.
- **Evaluation.** `paperLives/achievements.ts`: unlock rows in `plAchievements`, unique per owner and id, written when a year or a life ends and when the next life begins, never on a passive tick; each writes an `achievement` story line. Publication runs tally unlocks for rarity, as the other games do.
- **Album and boards.** `paperLives/album.ts`: the album (finished lives newest first with their portraits, epitaphs, traits and highlights), the family tree (each life with its depth under the life it continued), the Following card (each followed player's current public life, while the game is open to the viewer), and the board query for both boards and both periods. The boards read the record rows directly, as Idle Angler's do, rather than from the hourly publication: a row only changes at a death, so there is nothing for a publication to freeze.
- **Companion.** An Album tab (Life, People, Work, Album, More), and Rankings and Achievements pages linked from More.
- **Profile.** The shared profile shows Paper Lives when the life is public and the game is open: the current character, lives lived, the longest, the traits and the album's lives linking to their public pages. Paper Lives counts towards Regular and Collector like any game.

Tests: the catalog, the career fold, set pieces, and on the backend the fold happening once, awards and the rarity tally, the album and family tree, the Following card's gate, the boards' ranks and the profile section. At 390 wide the new pages have no overflow or console errors.

Next: L6, the three alert kinds, the weekly photo on the device code, the Photos family and the analytics events.

## L6 build (2026-10-14)

- **Alerts.** Three opt-in kinds on the D114 machinery (`lib/alerts.ts`, `alerts.ts`): `major_decision`, `life_ended` and `new_arrival`, switched on the More page with the shared devices, quiet hours and two-a-day cap. The tick compares the life before and after (`queuePaperLivesAlerts`): a major decision is raised once, on the tick it first stands open past the year's minimum (unchosen); a death once per life; a child or grandchild once per person, adoptions included. Outbox rows carry the life, the age and the decision or the newborn's id. The sender rechecks: a decision must still be open in the same year (else `year_closed`), the newborn still in the family, the life still current. Quiet hours hold a decision and a death until morning (a decision whose year closes overnight drops at the recheck) and skip a birth. The lock screen shows only the character's first name, and the baby's name for an arrival. The preference block is three more switches on `users.alerts` (`majorDecision`, `lifeEnded`, `newArrival`) rather than the spec's separate `paperLivesAlerts` block, as Idle Angler's were added (D115). Deleting Paper Lives progress turns its three switches off and leaves the shared devices while another game has a character.
- **Photos.** The weekly code on the device title bar (template v2, `Photo code 482 917`, or `Photo 482 917` in the narrow portrait columns as Idle Angler's fly code), keyed to the Paper Lives installation under its own tag and never in the companion preview. It shows while a life is lived or paused, not on a memorial. Entering it on the Album page (`paperLives/photos.ts`) takes a photo into `plPhotos`: the name, age, pet's name and the portrait key as they are that week, kept with the life by ordinal. One a week, last week's code accepted, ten wrong guesses a day, no effect on play. Photos show on the claim card for the current life, on each finished life's album card and on its public page. The free stage portraits are not stored as rows: the album draws each life's portrait from its record, so nothing would be gained.
- **Photos family.** Photos 1, 6, 12, 24 and 52 (achievements catalog v2, 131 ids). The count is an account total on the profile (`photosClaimed`), added to the career when it is read and never folded from a life.
- **Analytics.** Server: `life ended` once per finished life with an age band and the cause id, consent-gated like the activation events. Companion: `decision chosen` (major or not), `aged up` (the year's elapsed time in two-hour bands), `next life started` (child or stranger), `photo taken`, `album viewed`, `rankings viewed`, `life page viewed`. Paper Lives pages now report their own game on every event.
- **Privacy and help.** A Paper Lives section on the privacy page, shown once the game is listed, as Idle Angler's; Photos and Alerts sections on the help page.
- **Deletion fix.** Deleting Paper Lives progress now also removes the achievement rows and clears the career and photo totals on the profile. L5 had left them, so a fresh start after a deletion would have kept its old achievements.

Tests: alert queueing, the recheck, quiet hours and the round trip to the push service; the photo code on the device only, the weekly limit, last week's code, wrong guesses and the memorial; photos on the album and public page; deletion of photos, achievements, career and switches. 264 device previews pass the sweep with the code in the title bar; lint and the Ruby crosscheck (724 renders) pass. At 390 wide the Album, More and public life pages have no overflow or console errors.

Next: L7, the plugin and listing.

## L7 (2026-10-14)

Barry asked for everything but the submission.

- **Connect pages.** `/connect/trmnl/paper-lives/install` and `/manage`, Idle Angler's pages on the shared install and management functions, gated like the other Paper Lives pages. The install asks only for a public name when the account has none, since the game names each character.
- **Art.** A colour pixel-art icon in the style of the other two (`tools/art/gameIcons.ts`: a snapshot of a character and their dog in gold album corners over an older photo), with the web icon set under `public/games/paper-lives/` and the 512px plugin icon at [`docs/assets/paper-lives-plugin-icon.png`](assets/paper-lives-plugin-icon.png). Listing image candidate: [`docs/assets/paper-lives-featured.png`](assets/paper-lives-featured.png), the OG full layout of a fictional 34-year-old nurse with no photo code; the same picture is the game page's sample.
- **The plugin.** Created on trmnl.com as plugin 569, in development and private, with the icon, categories entertainment, games and life, a 15-minute refresh and these URLs:
  - Installation: `https://trmnlgames.com/connect/trmnl/paper-lives/install`
  - Installation success webhook: `https://exciting-cormorant-948.convex.site/trmnl/paper-lives/install/success`
  - Management: `https://trmnlgames.com/connect/trmnl/paper-lives/manage`
  - Markup: `https://exciting-cormorant-948.convex.site/trmnl/paper-lives/v1/screen`
  - Uninstall webhook: `https://exciting-cormorant-948.convex.site/trmnl/paper-lives/uninstall`
  - Knowledge base: `https://trmnlgames.com/help/paper-lives`
- **Client ID.** `TRMNL_CLIENT_ID_PAPER_LIVES` in `apps/web/wrangler.jsonc`; the manage page verifies Configure links with it. Installs exchange only the code, so no secret is stored.

Left for Barry: install it on your TRMNL while the game is hidden (the admin allowlist lets you through), Save, and check the first screen, the companion and an uninstall; switch the game to preview or live from the admin page's Games card; submit for review when you choose.

