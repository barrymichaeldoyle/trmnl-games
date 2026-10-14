import { createFileRoute } from '@tanstack/react-router'
import { ACTIVE_CONTENT, catalogs } from '@trmnl-games/desk-crawler/content'
import { DESK_CRAWLER_INSTALL_URL, ProsePage, SUPPORT_EMAIL } from '../../lib/prose'
import { DESK_CRAWLER_OG, seo } from '../../lib/seo'

/** D112: the to-do list section appears once the active catalog has one. */
const TODO = catalogs[ACTIVE_CONTENT].todo
const STANDUP = TODO === undefined ? '' : `${String(TODO.refillHour).padStart(2, '0')}:00`
/** D122: the bag and pouch ladders are read from the active catalog, so the help page names the real rungs and prices. */
const BAGS = catalogs[ACTIVE_CONTENT].bagLadder.tiers
const POUCHES = catalogs[ACTIVE_CONTENT].potionPouch?.tiers ?? []
const MERCHANT_OFF = catalogs[ACTIVE_CONTENT].merchant?.ladderDiscountPct ?? 0
const gold = (n: number) => `${n.toLocaleString('en-US')} gold`
/** "a Lunchbox (30) for 120 gold, a Cooler Bag (40) for 450 gold and a Vending Cart (60) for 1,500 gold". */
function rungs(list: readonly { name: string; size: number; price: number | undefined }[]): string {
  const parts = list.map((rung) => `a ${rung.name} (${rung.size})${rung.price === undefined ? '' : ` for ${gold(rung.price)}`}`)
  return parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
}
const SHOP_BAGS = BAGS.filter((tier) => tier.milestone === undefined && tier.price !== undefined).map((tier) => ({ name: tier.name, size: tier.capacity, price: tier.price }))
const SHOP_POUCHES = POUCHES.filter((tier) => tier.milestone === undefined && tier.price !== undefined).map((tier) => ({ name: tier.name, size: tier.cap, price: tier.price }))
const TOTE = BAGS.find((tier) => tier.milestone?.ticksExplored !== undefined)
const TOP_BAG = BAGS.at(-1)?.capacity ?? 0
const MERCHANT_LINE = MERCHANT_OFF > 0 ? ` A wandering merchant sometimes offers the next one at ${MERCHANT_OFF}% off.` : ''
/** D129: the workbench's materials and prices, read from the active catalog. */
const WORKBENCH = catalogs[ACTIVE_CONTENT].workbench
const MATERIAL_NAME = (id: string) => WORKBENCH?.materials.find((m) => m.id === id)?.name ?? id
/** "6 Scrap and 4 Parts plus 500 gold". */
const price = (cost: { gold: number; materials: Readonly<Record<string, number>> }) => {
  const parts = Object.entries(cost.materials).map(([id, n]) => `${n} ${MATERIAL_NAME(id)}`)
  const mats = parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
  return `${mats} plus ${gold(cost.gold)}`
}
const TIER_STEPS = WORKBENCH?.steps.filter((s) => s.kind === 'tier') ?? []
const REINFORCE_STEPS = WORKBENCH?.steps.filter((s) => s.kind === 'reinforce') ?? []
const MATERIALS_LINE = WORKBENCH === undefined ? '' : WORKBENCH.materials.map((m) => `${m.name} from ${m.rarities.join(' and ')} gear`).join(', ')
/** D131: potion strengths, their drops per biome tier and the combine recipe, read from the active catalog. */
const POTIONS = catalogs[ACTIVE_CONTENT].potions
const STRENGTHS_LINE = POTIONS === undefined ? '' : ((parts) => `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`)(POTIONS.strengths.map((s) => `${s.name.toLowerCase()} (${s.healPct}%)`))
/** "the Office Cubicles drop mostly minor potions; the Server Room mostly healing potions, with some majors; …" */
const DROPS_LINE = POTIONS === undefined ? '' : catalogs[ACTIVE_CONTENT].biomes.map((biome) => {
  const weights = POTIONS.dropWeightsByTier[biome.tier] ?? {}
  const ranked = POTIONS.strengths.filter((s) => (weights[s.id] ?? 0) > 0).sort((a, b) => (weights[b.id] ?? 0) - (weights[a.id] ?? 0))
  const top = ranked[0]
  const rest = ranked.slice(1).map((s) => `${s.name.toLowerCase()}s`)
  return top === undefined ? '' : `the ${biome.name} drop${ranked.length === 1 ? ' only' : ' mostly'} ${top.name.toLowerCase()}s${rest.length === 0 ? '' : `, with some ${rest.join(' and ')}`}`
}).filter(Boolean).join('; ')
const COMBINE_LINE = POTIONS === undefined ? '' : ((from, to) => `${POTIONS.combine.count} ${from?.name.toLowerCase() ?? 'minor potion'}s and ${Object.entries(POTIONS.combine.materials).map(([id, n]) => `${n} ${MATERIAL_NAME(id)}`).join(', ')} become one ${to?.name.toLowerCase() ?? 'major potion'}`)(POTIONS.strengths.find((s) => s.id === POTIONS.combine.from), POTIONS.strengths.find((s) => s.id === POTIONS.combine.to))
/** D133: the floors in order, their levels and whether the catalog has field notes, read from the active catalog. */
const FLOORS = catalogs[ACTIVE_CONTENT].biomes
const LORE = catalogs[ACTIVE_CONTENT].lore
/** "the Server Room at level 4, the Cafeteria Depths at level 8, the Archive at level 12 and the Parking Garage at level 16". */
const FLOORS_LINE = ((parts) => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`))(FLOORS.filter((b) => b.unlockLevel > 1).map((b) => `the ${b.name} at level ${b.unlockLevel}`))
/** "5, 16, 30, 45 or 65 depending on the floor". */
const TASK_PAY = TODO === undefined ? '' : ((parts) => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} or ${parts.at(-1)}`))([...new Set(FLOORS.map((b) => b.tier))].sort((a, b) => a - b).map((tier) => String(TODO.rewardByTier[tier] ?? '')))
/** P35: the career ladder and the levels features arrive at, read from the active catalog. */
const CAREER = catalogs[ACTIVE_CONTENT].career
const UNLOCKS = catalogs[ACTIVE_CONTENT].unlocks
/** P37: the classes and the level the roster opens at, read from the active catalog. */
const CLASSES = catalogs[ACTIVE_CONTENT].classes
const ROSTER_LEVEL = catalogs[ACTIVE_CONTENT].unlocks?.roster
/** D141: meetings, their boons and the level they arrive at, read from the active catalog. */
const MEETINGS = catalogs[ACTIVE_CONTENT].meetings
const MEETING_LEVEL = catalogs[ACTIVE_CONTENT].unlocks?.meetings
/** D155: the level salvage and the workbench open at; undefined under catalogs where they were open from the start. */
const WORKBENCH_LEVEL = catalogs[ACTIVE_CONTENT].unlocks?.workbench
/** D145: lost property, read from the active catalog. */
const LOST_PROPERTY = catalogs[ACTIVE_CONTENT].lostProperty
const EFFECTS = catalogs[ACTIVE_CONTENT].effects ?? []
/** "+10% attack" or "traps hurt 30% less": a meeting boon's one modifier in words. */
const boonLine = (m: { attackPct?: number; defensePct?: number; xpPct?: number; goldPct?: number; trapDamagePct?: number }) =>
  [m.attackPct ? `${signed(m.attackPct)}% attack` : '', m.defensePct ? `${signed(m.defensePct)}% defense` : '', m.xpPct ? `${signed(m.xpPct)}% XP from wins` : '', m.goldPct ? `${signed(m.goldPct)}% gold` : '', m.trapDamagePct ? `traps hurt ${m.trapDamagePct}% less` : ''].filter(Boolean).join(', ')
const signed = (value: number) => (value > 0 ? `+${value}` : `−${Math.abs(value)}`)
const CAREER_GOLD = CAREER?.rungs.reduce((sum, rung) => sum + rung.gold, 0) ?? 0
/** " It arrives at level 3." or nothing under a catalog without unlocks. */
const arrives = (feature: 'todo' | 'stances' | 'choices' | 'merchant' | 'raids') => (UNLOCKS === undefined ? '' : ` It arrives at level ${UNLOCKS[feature]}.`)

/** D139: the office calendar, read from the active catalog, with each date rule in words. */
const OCCASIONS = catalogs[ACTIVE_CONTENT].occasions
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const NTH = ['first', 'second', 'third', 'fourth', 'fifth']
type Occasion = NonNullable<typeof OCCASIONS>[number]
function occasionDate(rule: Occasion): string {
  const date = rule.date
  const span = rule.days > 1 ? `, for ${rule.days} days` : ''
  switch (date.kind) {
    case 'fixed':
      return `${date.day} ${MONTHS[date.month - 1]}${span}`
    case 'nth_weekday': {
      const base = `the ${NTH[date.nth - 1]} ${WEEKDAYS[date.weekday]} of ${MONTHS[date.month - 1]}`
      const offset = date.offsetDays ?? 0
      return `${offset === 0 ? base : `the ${WEEKDAYS[(date.weekday + offset) % 7]} after ${base}`}${span}`
    }
    case 'friday_13th':
      return 'any Friday the 13th'
    case 'easter':
      return date.offsetDays === -2 ? `Good Friday to Easter Monday` : `${Math.abs(date.offsetDays)} days ${date.offsetDays < 0 ? 'before' : 'after'} Easter Sunday${span}`
    case 'table': {
      // Lunar New Year and Diwali move each year; name the next one.
      const next = date.dates.find((iso) => Date.parse(`${iso}T23:59:59Z`) >= Date.now())
      const [y, m, d] = (next ?? '').split('-').map(Number)
      return next === undefined ? 'a date that moves each year' : `a date that moves each year (next ${d} ${MONTHS[m! - 1]} ${y})`
    }
  }
}

/** The page's sections, for the jump list at the top: on a phone the page runs to about twenty screens. */
const CONTENTS: ReadonlyArray<readonly [string, string]> = [
  ['getting-started', 'Getting started'],
  ['if-the-qr-sends-you-back-to-setup', 'If the QR sends you back to setup'],
  ['how-time-works', 'How time works'],
  ['floors', 'Floors'],
  ['desk-keepsakes', 'Desk keepsakes'],
  ...(CAREER !== undefined ? [['career', 'Career'] as const] : []),
  ...(CLASSES !== undefined ? [['heroes-and-classes', 'Heroes and classes'] as const] : []),
  ['stances', 'Stances'],
  ['desk-raids', 'Desk raids'],
  ...(MEETINGS !== undefined ? [['meetings', 'Meetings'] as const] : []),
  ...(LOST_PROPERTY !== undefined ? [['lost-property', 'Lost property'] as const] : []),
  ...(TODO !== undefined ? [['to-do-list', 'To-do list'] as const] : []),
  ['potions', 'Potions'],
  ['the-wandering-merchant', 'The wandering merchant'],
  ['decisions', 'Decisions'],
  ['effects', 'Effects'],
  ...(OCCASIONS !== undefined ? [['office-calendar', 'Office calendar'] as const] : []),
  ['rare-and-epic-gear', 'Rare and epic gear'],
  ['when-your-bag-fills-up', 'When your bag fills up'],
  ['bigger-bags', 'Bigger bags'],
  ...(WORKBENCH !== undefined ? [['salvage-and-the-workbench', 'Salvage and the workbench'] as const] : []),
  ['getting-knocked-out', 'Getting knocked out'],
  ['recaps', 'Recaps'],
  ['understanding-rankings', 'Understanding rankings'],
  ['sharing-your-hero', 'Sharing your hero'],
  ['following-and-rivals', 'Following and rivals'],
  ['names', 'Names'],
  ['gender', 'Gender'],
  ['alerts', 'Alerts'],
  ['troubleshooting', 'Troubleshooting'],
  ['disconnecting-and-removing', 'Disconnecting and removing'],
  ['help', 'Help'],
]

export const Route = createFileRoute('/help/desk-crawler')({
  head: () => seo({ title: 'Desk Crawler help and setup', path: '/help/desk-crawler', description: 'Install Desk Crawler on TRMNL, choose a stance, meet the merchant, answer decisions, understand refresh timing, and fix a screen that looks out of date.', image: DESK_CRAWLER_OG }),
  component: () => (
    <ProsePage title="Desk Crawler on TRMNL" contents={CONTENTS}>
      <h2 id="getting-started">Getting started</h2>
      <ul>
        <li>Open <a href={DESK_CRAWLER_INSTALL_URL}>Desk Crawler in the TRMNL marketplace</a> and choose Install.</li>
        <li>Sign in to Desk Crawler, pick a public name and a hero name, and connect the installation.</li>
        <li>Back in TRMNL, click Save. Your hero's first adventure starts within 15 minutes.</li>
        <li>Add the plugin to a playlist, or to a mashup if you want your hero beside other plugins. All four layout sizes are supported.</li>
      </ul>
      <h2 id="if-the-qr-sends-you-back-to-setup">If the QR sends you back to setup</h2>
      <p>The QR opens the companion for the account you are signed in with. It does not start a new installation. Check the signed-in email shown on the setup page and use Switch account if you originally connected with a different account.</p>
      <p>If setup says “Reconnect Desk Crawler”, your TRMNL connection exists but the hero is missing. This can happen after the pre-launch game reset. Install a fresh copy of <a href={DESK_CRAWLER_INSTALL_URL}>Desk Crawler from TRMNL</a>, sign in with the same account, choose a new hero name, connect, then click Save back in TRMNL. Once the new copy works, remove the old copy from your playlist.</p>
      <p>If setup says “Save in TRMNL to start”, your hero is already prepared. Return to that installation in TRMNL and click Save.</p>
      <h2 id="how-time-works">How time works</h2>
      <p>
        The game world advances every 15 minutes whether or not your screen is on. Your TRMNL shows a snapshot and refreshes on its own schedule.
        Sleep Mode, slower refresh and other playlist items never reduce your hero's progress. Adventure times in the companion use your browser's local timezone.
      </p>
      <h2 id="floors">Floors</h2>
      <p>The building has {FLOORS.length} floors, and your hero starts in the {FLOORS[0]?.name}. Each opens at a level, whether or not you visit: {FLOORS_LINE}. Your TRMNL says “New area unlocked” when one does; travelling there is up to you, from the world map on the Hero page. Deeper floors have tougher monsters, more gold, better potions and bigger to-do pay. The {FLOORS[0]?.name} can't knock a hero out; every other floor can.</p>
      <ul>
        {FLOORS.map((floor) => (
          <li key={floor.id}><strong>{floor.name}</strong>{floor.unlockLevel > 1 ? ` (level ${floor.unlockLevel})` : ' (from the start)'}: {floor.monsterIds.map((id) => catalogs[ACTIVE_CONTENT].monsters.find((m) => m.id === id)?.name ?? id).join(', ')}.</li>
        ))}
      </ul>
      {LORE !== undefined ? <p>The Field notes page under More keeps what your hero has written down about each floor and monster. A floor's note opens the first time your hero stands on it, a monster's note with the first win over it. Notes are for reading; they change nothing in play.</p> : null}
      <h2 id="desk-keepsakes">Desk keepsakes</h2>
      <p>Keep Desk Crawler in your playlist and look for “Keepsake code” and a six-digit code, like 482 917, in the screen’s title bar (narrow portrait mashups shorten it to “Keepsake”). Enter that code in the companion’s Settings to collect a permanent office souvenir. Full-screen and mashup layouts both show it; the companion preview hides it.</p>
      <p>You can collect one keepsake each week, with a new code from Monday at 00:00 UTC. Last week’s code works too if your screen refreshes slowly. If you miss a week, you get the same design the week after. After collecting the full set, you can collect more of each. Keepsakes do not change XP, gear or rankings, and extra devices or faster refresh earn no extras.</p>
      {CAREER !== undefined ? (
        <>
          <h2 id="career">Career</h2>
          <p>Your hero always has one goal, shown at the top of the Hero page: “Win your first fight”, “Equip a piece of gear you found”, “Reach the Server Room”, “Buy the Laptop Backpack”. Some are reached by adventuring; the rest are things you do here, on the Bag or Hero page. Reaching a goal shows “Goal reached” on your TRMNL and sets a little gold aside ({CAREER_GOLD.toLocaleString('en-US')} across the whole ladder); press Claim on the Hero page to collect it, whenever you like. Goals never give XP, never expire and never fail; the next one simply waits, and the ladder keeps moving whether or not you have claimed.</p>
          <ul>
            <li>The Career page under More lists the {CAREER.rungs.filter((rung) => !rung.retired).length} goals in order, with the date you reached each. A goal you had already done when the ladder arrived counts as reached.</li>
            {UNLOCKS !== undefined ? <li>Features arrive by level, whether or not you visit: the to-do list at level {UNLOCKS.todo}, stances at level {UNLOCKS.stances}, office decisions at level {UNLOCKS.choices}, {MEETING_LEVEL !== undefined ? `meetings with coworkers at level ${MEETING_LEVEL}, ` : ''}{WORKBENCH_LEVEL !== undefined ? `salvage and the workbench at level ${WORKBENCH_LEVEL}, ` : ''}the wandering merchant at level {UNLOCKS.merchant} and desk raids at level {UNLOCKS.raids}. Your TRMNL says “Unlocked” when one does. The floors open by level too: {FLOORS_LINE}.</li> : null}
            <li>One goal asks you to switch your stance to Bold, which raids twice as often as Balanced. Once it counts you can switch back whenever you like.</li>
            <li>A few early goals come with a guarantee, so a new hero is never left waiting on luck: the first fight within a handful of adventures, a piece of gear within the first dozen, and a first decision, merchant and elite within a day or so of their level. Everything else is the ordinary roll.</li>
          </ul>
        </>
      ) : null}
      {CLASSES !== undefined ? (
        <>
          <h2 id="heroes-and-classes">Heroes and classes</h2>
          <p>Everyone starts as a Warrior. When your Warrior reaches level {ROSTER_LEVEL}, your TRMNL says “Unlocked: a second hero”, and you can recruit a Rogue from the Heroes page under More. The Rogue starts at level 1 with its own name, gear, gold, potions and goals.</p>
          <ul>
            <li>One hero adventures at a time, and that is the one your TRMNL shows and the one on the leaderboards. The other waits exactly where you left it: no adventures, no catch-up, and nothing runs out while it waits. A merchant visiting it leaves.</li>
            <li>You can switch once a day. Switching straight back within ten minutes does not count. A hero that is knocked out or on the road has to recover or arrive first.</li>
            <li>You can have one hero of each class. Achievements belong to you whichever hero earns them; a few belong to the Rogue alone.</li>
            <li><strong>Warrior</strong>: {CLASSES.warrior.blurb}</li>
            <li><strong>Rogue</strong>: {CLASSES.rogue.blurb} {CLASSES.rogue.hpPct}% health, attack {signed(CLASSES.rogue.modifiers.attackPct ?? 0)}%, defense {signed(CLASSES.rogue.modifiers.defensePct ?? 0)}%, {signed(CLASSES.rogue.modifiers.goldPct ?? 0)}% gold from every fight and find, and {CLASSES.rogue.raidEdgePct} points on its side of every desk raid. It levels at the Warrior's pace but gets knocked out a little more often.</li>
          </ul>
        </>
      ) : null}
      <h2 id="stances">Stances</h2>
      <p>Choose how careful your hero is on the Hero page.{arrives('stances')} The stance applies from the next adventure, and you can change it whenever you like. Your TRMNL shows it beside the bag count, under a gauge whose needle sits low for Cautious, in the middle for Balanced and high for Bold.</p>
      <ul>
        <li><strong>Cautious</strong> drinks a potion below 65% HP, rests below 50% and sets off again at 90%. It earns 90% of the usual XP from wins.</li>
        <li><strong>Balanced</strong>, the default, drinks below 50%, rests below 35% and sets off again at 75%, with the usual XP.</li>
        <li><strong>Bold</strong> drinks below 35%, rests below 20% and sets off again at 60%. It earns 115% XP from wins but gets knocked out more often.</li>
      </ul>
      <p>Office Cubicles can't knock a hero out, so Bold has no knockout risk there. On every other floor a knockout costs gold and sends your hero back to Office Cubicles, and Bold is knocked out most often.</p>
      <h2 id="desk-raids">Desk raids</h2>
      <p>While exploring, heroes sometimes raid each other's desks. It happens by itself, to every active hero{UNLOCKS === undefined ? '' : ` from level ${UNLOCKS.raids}`}, with nothing to press and no way to aim it.{UNLOCKS === undefined ? '' : ` Below level ${UNLOCKS.raids} a hero neither raids nor gets raided.`} The raid shows up in both heroes' adventure logs with the other player's public name, and the Hero page keeps a record of your hero's raids.</p>
      <ul>
        <li>Who wins is a coin toss, moved only by stance. Level, gear and effects never count. Cautious adds 10 points to its side of the toss, Balanced adds nothing and Bold takes 5 away, whether raiding or defending.</li>
        <li>How often your hero raids depends on stance too: Cautious about every other day of exploring, Balanced about once a day, Bold about twice a day.</li>
        <li>The loser hands over 5% of its gold to the winner, so gold only changes hands. Both lose health: the loser 30% of its maximum HP, the winner 10%. Thrifty gear takes its points off the gold loss.</li>
        <li>A raid can knock a hero out, exactly like a fight; in Office Cubicles your hero is rescued instead. Raids only find heroes who are exploring or resting, and a hero raided once is left alone for about six hours.</li>
        <li>If you'd rather lose fewer raids, pick Cautious: it raids least and wins most.</li>
      </ul>
      {MEETINGS !== undefined ? (
        <>
          <h2 id="meetings">Meetings</h2>
          <p>Now and then, instead of a fight, your hero runs into another player's hero on the same floor{MEETING_LEVEL === undefined ? '' : `, from level ${MEETING_LEVEL}`}. They grab a coffee, swap war stories or split a sandwich, and both heroes get the same small boon for {EFFECTS.find((effect) => effect.id === MEETINGS.kinds[0]?.effectId)?.durationTicks ?? 8} adventures. Both adventure logs tell the story with the other player's public name, and the Log tab lists your hero's last five meetings.</p>
          <ul>
            {MEETINGS.kinds.map((kind) => {
              const effect = EFFECTS.find((rule) => rule.id === kind.effectId)
              return <li key={kind.id}><strong>{kind.name}</strong>: {effect?.name ?? kind.effectId}, {effect === undefined ? '' : boonLine(effect.modifiers)}.</li>
            })}
            <li>Nothing changes hands and nobody can lose. A meeting takes the place of one adventure, and the boon about makes up for it.</li>
            <li>It happens at the same rate whatever your stance or class, about every other day for a hero who is out exploring. Heroes only meet while exploring or resting, and a hero who has just had a meeting is left alone for about twelve hours.</li>
          </ul>
        </>
      ) : null}
      {LOST_PROPERTY !== undefined ? (
        <>
          <h2 id="lost-property">Lost property</h2>
          <p>When your hero is knocked out outside the Office, it drops a spare of its weapon or armour on that floor, with your public name on it in marker. Your hero keeps everything it was wearing. Later, another player's hero exploring that floor may find the spare instead of an ordinary find, and your TRMNL tells you who found it.</p>
          <ul>
            <li>Your hero can find other players' spares the same way. A spare is ordinary gear: equip it, sell it, salvage it or take it to the workbench. It comes at the plain stats for its kind and rarity, without the first owner's upgrades.</li>
            <li>The name stays on it. The Bag page and the Log tab's Lost property card show whose it was, and so does your hero page while you hold it.</li>
            <li>Nothing is lost and nothing extra is found: a spare only ever takes the place of a find your hero was making anyway. Career goals and Christmas presents are always new.</li>
            <li>Only one spare of yours lies about at a time. If your hero is knocked out again before anyone finds it, the new spare replaces the old one.</li>
          </ul>
        </>
      ) : null}
      {TODO !== undefined ? (
        <>
          <h2 id="to-do-list">To-do list</h2>
          <p>Your hero keeps an office to-do list of three small tasks, such as “Defeat 4 Paper Imps”, “Find 2 pieces of gear” or “Explore the Server Room for 16 adventures”.{arrives('todo')} It works through them by itself while exploring, and the Hero page shows each task's progress. When a task is done, your screen says “Ticked off” and your hero gets a little gold: {TASK_PAY} depending on the floor. Tasks never give XP, so they never change the rankings.</p>
          <ul>
            <li>Every morning at {STANDUP} your TRMNL's local time, the stand-up gives new tasks for the ones that are done. Your screen lists them.</li>
            <li>Tasks never expire and an unfinished task costs nothing. A task your hero can't get on with is swapped by itself after two stand-ups.</li>
            <li>At least two of the three tasks can be done where your hero is. At most one asks for a trip to another area, if you want to send your hero there.</li>
            <li>Once between stand-ups you can swap one unfinished task for a different one on the Hero page. That's optional; the list runs fine on its own.</li>
          </ul>
        </>
      ) : null}
      <h2 id="potions">Potions</h2>
      {POTIONS === undefined
        ? <p>A healing potion restores 40% of your hero's maximum HP, rounded up. Your hero drinks one automatically when HP falls below the stance's potion level while exploring, and the adventure log notes it. With no potions left, your hero rests below the stance's rest level and sets off again once recovered. You can also drink one yourself from the Hero page whenever your hero is exploring or resting and not at full HP. Potions are found while exploring and never take up bag space.</p>
        : <>
          <p>Potions come in {POTIONS.strengths.length} strengths: {STRENGTHS_LINE}, each restoring that share of your hero's maximum HP, rounded up. Finds depend on where your hero is: {DROPS_LINE}. A new hero starts with healing potions, and the merchant and office decisions hand out healing potions too. All strengths share one pouch and never take up bag space.</p>
          <p>Your hero drinks automatically when HP falls below the stance's potion level while exploring: the weakest potion that puts it back above the stance's potion level, or the strongest it has when nothing weaker would do. The adventure log names what it drank. With no potions left, your hero rests below the rest level and sets off again once recovered. You can also drink one yourself from the Hero page whenever your hero is exploring, resting or travelling and not at full HP; with more than one strength in the pouch, the Hero page asks which.</p>
          <p><strong>Combining.</strong> On the Bag page, {COMBINE_LINE}. It never makes more potions than it takes, so the pouch cannot overflow, and nothing combines by itself.</p>
        </>}
      <p>Potions are kept in a pouch. A new hero carries a {POUCHES[0]?.name ?? 'Thermos'} that holds {POUCHES[0]?.cap ?? 20}. Bigger pouches are bought with gold on the Bag page, one at a time: {rungs(SHOP_POUCHES)}.{MERCHANT_LINE} When the pouch is full, a potion find becomes gold instead.</p>
      <h2 id="the-wandering-merchant">The wandering merchant</h2>
      <p>Now and then your hero meets a wandering merchant while exploring. Your screen says “Merchant visiting. Shop in the companion soon.” and the Bag page shows up to three offers: a few potions, and the next pouch or bag{MERCHANT_OFF > 0 ? ` at ${MERCHANT_OFF}% off the Bag page price` : ''}. Each offer sells once. The merchant moves on after four adventures or after your last purchase. Missing a visit costs nothing.</p>
      <h2 id="decisions">Decisions</h2>
      <p>Sometimes the office asks your hero something small, like chipping in for a cake or staying late. Your screen says “A decision is waiting in the companion.” and the Hero page shows both options with exactly what each one changes. If you don't answer within about a day, the option marked as the default happens by itself, so adventures never wait for you.</p>
      <h2 id="effects">Effects</h2>
      <p>Some moments leave your hero with a short effect, listed on the Hero page with the adventures it has left. Beating an elite makes your hero Fired up (+10% attack for eight adventures). Chipping in for cake makes your hero Well fed (+10% XP for eight adventures). A trap leaves your hero Bruised (−15% defense for four adventures). Your hero holds at most three effects. Any rest shakes off bad effects, and a knockout clears them all.</p>
      {OCCASIONS !== undefined ? (
        <>
          <h2 id="office-calendar">Office calendar</h2>
          <p>Holidays and office occasions dress your hero's scene for the day: decorations along the ceiling, something on the floor, sometimes a hat, and in the Office Cubicles a different view from the window. They follow your TRMNL's local date. The first time your hero sees one, the adventure log names it, and most bring one small bonus while they last. The Hero page shows today's occasion and the next one.</p>
          <ul>
            {OCCASIONS.map((rule) => <li key={rule.id}><strong>{rule.name}</strong>, {occasionDate(rule)}: {rule.id === 'friday_13th' ? 'every desk raid goes wrong (below).' : rule.effectLabel ? `${rule.effectLabel}.` : 'decorations only.'}</li>)}
          </ul>
          <p><strong>Friday the 13th.</strong> Desk raids start twice as often, and every one of them goes wrong: nobody wins, and both heroes lose 20% of their maximum HP and 5% of their gold, which nobody gets. It counts as a mishap, not a win or a loss, in your hero's raid record.</p>
          <p><strong>Christmas.</strong> Your hero finds one wrapped gift each Christmas: a piece of gear from the floor it's on, on its first adventure of the three days.</p>
        </>
      ) : null}
      <h2 id="rare-and-epic-gear">Rare and epic gear</h2>
      <p>Gear comes as common, uncommon, rare or epic. Epic gear is the rarest, about one find in a hundred, and the strongest. Rare and epic gear also carry one special trait, shown in the item's name and explained on the Bag page:</p>
      <ul>
        <li><strong>Vampiric</strong> heals 5% of maximum HP after every win.</li>
        <li><strong>Lucky</strong> adds 20% gold from wins and finds.</li>
        <li><strong>Sturdy</strong> takes 40% less damage from traps.</li>
        <li><strong>Thrifty</strong> keeps more gold when things go wrong: a retreat costs nothing and a knockout costs 5% of gold instead of 10%.</li>
      </ul>
      <h2 id="when-your-bag-fills-up">When your bag fills up</h2>
      <p>A new hero starts with a small paper bag that holds 6 pieces of gear. Equipped gear and potions don’t take up space. A full bag alone does not stop adventures: the next piece you find is held safely, then your hero sleeps until you make room. The held find is never automatically sold or discarded.</p>
      <h2 id="bigger-bags">Bigger bags</h2>
      <p>Your bag grows with gold. {TOTE ? `Your hero finds a ${TOTE.name} (${TOTE.capacity}) within the first couple of hours. ` : ''}After that, bigger bags are bought on the Bag page, one at a time: {rungs(SHOP_BAGS)}, up to {TOP_BAG} slots. There are no level requirements and no bag drops: save up and buy.{MERCHANT_LINE}</p>
      <ol className="[&_li]:list-decimal">
        <li>Open Bag in the companion. Equip any upgrades and sell spare gear to free space.</li>
        <li>If a find is being held, choose Claim find. Leave at least one free slot after claiming it so adventures can resume.</li>
        <li>Choose Resume adventures. You can pick an unlocked destination at the same time. Your hero sets off again within 15 minutes.</li>
      </ol>
      <p>Equipping gear does not free a slot. Selling gear or claiming a find does not wake your hero automatically. Bag sleep is separate from your TRMNL’s Sleep Mode; a sleeping display never stops the game.</p>
      {WORKBENCH !== undefined ? <>
        <h2 id="salvage-and-the-workbench">Salvage and the workbench</h2>
        <p>{WORKBENCH_LEVEL !== undefined ? `From level ${WORKBENCH_LEVEL}, s` : 'S'}pare gear has two ways out of the bag: sell it for gold, or salvage it for materials on the Bag page. Salvage pays the tier the piece was found at, in units of its rarity’s material: {MATERIALS_LINE}. Epic gear pays {WORKBENCH.epicYieldMultiplier} times as much. Materials sit beside your potions, take no bag space and are never sold. Nothing is salvaged unless you choose it.{WORKBENCH_LEVEL !== undefined ? ` Before level ${WORKBENCH_LEVEL}, sell your spares: the first upgrade needs level ${WORKBENCH_LEVEL} anyway.` : ''}</p>
        <p>The workbench spends materials and gold on the gear your hero wears, in place: the piece keeps its name and trait, and only its numbers change. Each piece has one next step. {TIER_STEPS.map((s, i) => `${i === 0 ? 'Raising a tier-1 piece to Mk II' : `Mk II to Mk III`} costs ${price(s)}`).join('; ')}; a piece can only be raised to a tier your hero’s level could equip. Once a piece is Mk III (or was found there), reinforcement adds one point a step: {REINFORCE_STEPS.map((s) => `+${s.to} for ${price(s)}`).join(', ')}. {REINFORCE_STEPS.length > 0 ? `After +${REINFORCE_STEPS.at(-1)!.to} the piece is finished.` : ''} Rare and epic gear can also have a trait of your choosing fitted for {price(WORKBENCH.affix)}, replacing the one it has.</p>
        <p>Upgrades never fail, nothing is rolled, and the workbench never acts on its own. Salvaging an upgraded piece pays what it was found at, not what you spent on it, so build what you will wear.</p>
      </> : null}
      <h2 id="getting-knocked-out">Getting knocked out</h2>
      <p>Your hero revives automatically after about two hours and returns to Office Cubicles. You keep your XP and equipment; getting knocked out costs 10% of your current gold. You do not need to open the companion or press anything.</p>
      <h2 id="recaps">Recaps</h2>
      <p>Your screen carries a short recap of the last finished night or day, in your TRMNL's local time. At 07:00 the night recap reports 19:00 to 07:00 and stays up all day. At 19:00 the day recap reports 07:00 to 19:00 and stays up all evening and overnight. The office window shows day and night on the same hours. The newest stories above it are always live.</p>
      <h2 id="understanding-rankings">Understanding rankings</h2>
      <p>The screen shows the seven-day XP Top 5 for your level group, with your own row marked, or added below the list when you sit lower. The companion also offers a 24-hour view and a lifetime board. Rankings publish hourly, so a recent adventure or level-up can appear before your rank updates.</p>
      <p>Paused and sleeping heroes keep their progress, but their recent XP ages out. After seven days without earned XP, they leave the weekly board until they earn XP again. Lifetime progress stays recorded.</p>
      <h2 id="sharing-your-hero">Sharing your hero</h2>
      <p>Your hero has a public page with its level, rank, current floor, lifetime counts and achievements. Gold and the adventure log are never shown, and gear only when it's another player's spare your hero is holding. Your name links to the page from the rankings and from other players' raids and meetings, and that's where other players follow you. Settings has Share and Copy link buttons, and a shared link shows a picture card of your hero with its name, level and rank. If you'd rather not have a page, Hide my hero page in Settings hides it straight away. Nobody can then follow you or name you their rival.</p>
      <h2 id="following-and-rivals">Following and rivals</h2>
      <p>Signed in, you can follow another player from their public hero page, up to 20 players. Everyone you follow is listed under Rankings, with their hero's level, rank and where they are, and links to their pages. Mark one of them as your rival to keep them at the top of the list with a line saying who is ahead. Your rival also gets raided more: half your hero's raids go after their desk when they can be raided. Your rival is told who named them and can name you back. Following anyone else changes nothing in play, and nobody is told when you follow them. If a player hides their page, you see only their name until they show it again. If they change their public name, they drop off your list.</p>
      <h2 id="names">Names</h2>
      <p>You have two names. Your hero's name is on your TRMNL, the rankings and your hero page; to change it, buy a “Hi, my name is” name tag on the Bag page for 200 gold. One is in stock a day. Your public name is you, across every TRMNL game: it shows beside your hero in the rankings, in other players' raids and meetings, and in your page's link. You can change it for free once every 7 days from Account. Links to your old page stop working, and nobody else can take your old name for 7 days.</p>
      <h2 id="gender">Gender</h2>
      <p>You pick your hero's gender, male or female, when you create it. It only changes how your hero looks, on your TRMNL, your hero page and in other players' meetings; neither one plays any differently. To change it later, buy a makeover on the Bag page for 200 gold, any time.</p>
      <h2 id="alerts">Alerts</h2>
      <p>Your TRMNL is the main way to keep up with your hero, but Settings can also send a phone notification in two cases, each off until you turn it on:</p>
      <ul>
        <li><strong>Hero asleep:</strong> the bag is full and adventures have stopped. It comes half an hour after the nap starts, so nothing arrives if you are already sorting out the bag, and once per nap.</li>
        <li><strong>Merchant deal:</strong> a merchant is selling the next bag or pouch{MERCHANT_OFF > 0 ? ` at ${MERCHANT_OFF}% off` : ''} and your hero has the gold. At most once a day. A merchant with only potions never sends one.</li>
      </ul>
      <p>You get at most two alerts a day. Quiet hours run from 21:00 to 08:00 unless you change them: a nap alert waits until they end, and a merchant deal that turns up then is skipped. Before sending, the game checks that the alert still holds, so you never hear about a nap that is already over or an offer that has gone. Decisions, raids, knockouts, level-ups and keepsakes never send alerts.</p>
      <p>Choose Allow on this device in Settings, then accept your browser’s prompt. On iPhone and iPad, first add TRMNL Games to your Home Screen (Share, then Add to Home Screen) and open it from there. Each device you allow is listed in Settings with a Remove button; removing the last one turns alerts off.</p>
      <h2 id="troubleshooting">Troubleshooting</h2>
      <h3 id="not-on-your-screen">Your hero isn't on your screen</h3>
      <ul>
        <li>Clicking Save adds Desk Crawler to your TRMNL playlist. Your device shows the playlist one plugin at a time, at its refresh rate, so Desk Crawler appears when its turn comes round. With several plugins and a slow refresh rate that can take a while.</li>
        <li>Open Playlists in TRMNL and check that Desk Crawler is there, on the device you're looking at if you have more than one, and that no schedule hides it at this time of day.</li>
        <li>Sleep Mode stops the screen refreshing overnight. Your hero keeps adventuring, and the screen catches up when the device wakes.</li>
        <li>A screen that says "The first adventure starts within 15 minutes" is working. The first story arrives on the next quarter hour.</li>
        <li>The companion's Hero page always shows what your hero is doing, whatever the screen shows.</li>
      </ul>
      <h3 id="if-the-screen-looks-old">The screen looks old</h3>
      <ul>
        <li>"Updates delayed" means the game service is running late. Nothing is lost and you don't need to do anything.</li>
        <li>If the companion website is current but the screen is not, check the plugin's refresh setting and playlist position in TRMNL.</li>
        <li>Adventures run every quarter hour, on the hour and at :15, :30 and :45 in your TRMNL timezone. The screen shows no countdown; the time beside each story is when it happened, and the companion shows the next adventure.</li>
        <li>If you disconnected or uninstalled, install again from TRMNL. Your hero keeps all progress.</li>
      </ul>
      <h2 id="disconnecting-and-removing">Disconnecting and removing</h2>
      <p>
        Disconnecting stops new screens for that installation. TRMNL may keep showing the last image until you remove the plugin from your playlist; we
        cannot erase an image already on your device.
      </p>
      <h2 id="help">Help</h2>
      <p>
        Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> for account or connection help. We aim to reply within two business days.
      </p>
    </ProsePage>
  ),
})
