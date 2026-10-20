import { DESK_CRAWLER_INSTALL_URL, SUPPORT_EMAIL } from '../../lib/prose'
import { HELP_FACTS as F, nextTableDate, signed, type Cost, type Modifiers, type Occasion } from './-deskCrawlerFacts'
import type { HelpPage } from './-deskCrawlerHelp'

const gold = (n: number) => `${n.toLocaleString('en-US')} gold`
const and = (parts: readonly string[], last = 'and') => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} ${last} ${parts.at(-1)}`)
const rungs = (list: readonly { name: string; size: number; price: number }[]) => and(list.map((rung) => `a ${rung.name} (${rung.size}) for ${gold(rung.price)}`))
const price = (c: Cost) => `${and(c.materials.map((m) => `${m.n} ${m.name}`))} plus ${gold(c.gold)}`
const boonLine = (m: Modifiers) => [m.attackPct ? `${signed(m.attackPct)}% attack` : '', m.defensePct ? `${signed(m.defensePct)}% defense` : '', m.xpPct ? `${signed(m.xpPct)}% XP from wins` : '', m.goldPct ? `${signed(m.goldPct)}% gold` : '', m.trapDamagePct ? `traps hurt ${m.trapDamagePct}% less` : ''].filter(Boolean).join(', ')
const FLOORS_LINE = and(F.floors.filter((b) => b.level > 1).map((b) => `the ${b.name} at level ${b.level}`))
const arrives = (feature: 'todo' | 'stances' | 'choices' | 'merchant' | 'raids') => (F.unlocks === undefined ? '' : ` It arrives at level ${F.unlocks[feature]}.`)

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const NTH = ['first', 'second', 'third', 'fourth', 'fifth']
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
      return date.offsetDays === -2 ? 'Good Friday to Easter Monday' : `${Math.abs(date.offsetDays)} days ${date.offsetDays < 0 ? 'before' : 'after'} Easter Sunday${span}`
    case 'table': {
      // Lunar New Year and Diwali move each year; name the next one.
      const next = nextTableDate(date.dates)
      return next === null ? 'a date that moves each year' : `a date that moves each year (next ${next.getUTCDate()} ${MONTHS[next.getUTCMonth()]} ${next.getUTCFullYear()})`
    }
  }
}

export const en: HelpPage = {
  seoTitle: 'Desk Crawler help and setup',
  description: 'How to set up Desk Crawler on TRMNL and how each part of the game works, with fixes for a screen that looks out of date.',
  title: 'Desk Crawler on TRMNL',
  contents: {
    'getting-started': 'Getting started', 'if-the-qr-sends-you-back-to-setup': 'If the QR sends you back to setup', 'how-time-works': 'How time works', floors: 'Floors', 'desk-keepsakes': 'Desk keepsakes', career: 'Career', 'heroes-and-classes': 'Heroes and classes', stances: 'Stances', 'desk-raids': 'Desk raids', meetings: 'Meetings', 'lost-property': 'Lost property', 'to-do-list': 'To-do list', potions: 'Potions', 'the-wandering-merchant': 'The wandering merchant', decisions: 'Decisions', effects: 'Effects', 'office-calendar': 'Office calendar', 'rare-and-epic-gear': 'Rare and epic gear', 'when-your-bag-fills-up': 'When your bag fills up', 'bigger-bags': 'Bigger bags', 'salvage-and-the-workbench': 'Salvage and the workbench', 'getting-knocked-out': 'Getting knocked out', recaps: 'Recaps', 'understanding-rankings': 'Understanding rankings', 'sharing-your-hero': 'Sharing your hero', 'following-and-rivals': 'Following and rivals', names: 'Names', gender: 'Gender', alerts: 'Alerts', troubleshooting: 'Troubleshooting', 'disconnecting-and-removing': 'Disconnecting and removing', help: 'Help',
  },
  Body: () => (
    <>
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
      <p>The building has {F.floors.length} floors, and your hero starts in the {F.floors[0]?.name}. Each opens at a level, whether or not you visit: {FLOORS_LINE}. Your TRMNL says “New area unlocked” when one does; travelling there is up to you, from the world map on the Hero page. Deeper floors have tougher monsters, more gold, better potions and bigger to-do pay. The {F.floors[0]?.name} can't knock a hero out; every other floor can.</p>
      <ul>
        {F.floors.map((floor) => <li key={floor.id}><strong>{floor.name}</strong>{floor.level > 1 ? ` (level ${floor.level})` : ' (from the start)'}: {floor.monsters.join(', ')}.</li>)}
      </ul>
      {F.lore ? <p>The Field notes page under More keeps what your hero has written down about each floor and monster. A floor's note opens the first time your hero stands on it, a monster's note with the first win over it. Notes don't affect play.</p> : null}
      <h2 id="desk-keepsakes">Desk keepsakes</h2>
      <p>Keep Desk Crawler in your playlist and look for “Keepsake code” and a six-digit code, like 482 917, in the screen’s title bar (narrow portrait mashups shorten it to “Keepsake”). Enter that code in the companion’s Settings to collect a permanent office souvenir. Full-screen and mashup layouts both show it; the companion preview hides it. While a keepsake waits, the screen’s QR code collects it too: scan it with your phone and the companion adds it to your shelf, even with the title bar turned off. Where there is room, the code is printed beside it.</p>
      <p>You can collect one keepsake each week, with a new code from Monday at 00:00 UTC. Last week’s code works too if your screen refreshes slowly. If you miss a week, you get the same design the week after. After collecting the full set, you can collect more of each. Keepsakes do not change XP, gear or rankings, and extra devices or faster refresh earn no extras.</p>
      {F.career !== undefined ? (
        <>
          <h2 id="career">Career</h2>
          <p>Your hero always has one goal, shown at the top of the Hero page: “Win your first fight”, “Equip a piece of gear you found”, “Reach the Server Room”, “Buy the Laptop Backpack”. Some are reached by adventuring; the rest are things you do here, on the Bag or Hero page. Reaching a goal shows “Goal reached” on your TRMNL and sets a little gold aside ({F.career.gold.toLocaleString('en-US')} across the whole ladder); press Claim on the Hero page to collect it. Goals give no XP and never expire, and the next goal starts whether or not you have claimed.</p>
          <ul>
            <li>The Career page under More lists the {F.career.goals} goals in order, with the date you reached each. A goal you had already done when the ladder arrived counts as reached.</li>
            {F.unlocks !== undefined ? <li>Features arrive by level, whether or not you visit: the to-do list at level {F.unlocks.todo}, stances at level {F.unlocks.stances}, office decisions at level {F.unlocks.choices}, {F.meetings?.level !== undefined ? `meetings with coworkers at level ${F.meetings.level}, ` : ''}{F.workbench?.level !== undefined ? `salvage and the workbench at level ${F.workbench.level}, ` : ''}the wandering merchant at level {F.unlocks.merchant} and desk raids at level {F.unlocks.raids}. Your TRMNL says “Unlocked” when one does. The floors open by level too: {FLOORS_LINE}.</li> : null}
            <li>When stances open, your hero has none chosen and plays Balanced. One goal asks you to choose one; any of the three counts, and you can change it later.</li>
            <li>A few early goals are guaranteed to come up in time: the first fight within a handful of adventures, a piece of gear within the first dozen, and a first decision, merchant and elite within a day or so of their level. Everything else is down to chance.</li>
          </ul>
        </>
      ) : null}
      {F.classes !== undefined ? (
        <>
          <h2 id="heroes-and-classes">Heroes and classes</h2>
          <p>Everyone starts as a Warrior. When your Warrior reaches level {F.rosterLevel}, your TRMNL says “Unlocked: a second hero”, and you can recruit a Rogue from the Heroes page under More. The Rogue starts at level 1 with its own name, gear, gold, potions and goals.</p>
          <ul>
            <li>One hero adventures at a time, and that is the one your TRMNL shows and the one on the leaderboards. The other stays where you left it. It doesn't adventure or catch up later, and a merchant visiting it leaves.</li>
            <li>You can switch once a day. Switching straight back within ten minutes does not count. A hero that is knocked out or on the road has to recover or arrive first.</li>
            <li>You can have one hero of each class. Achievements belong to you whichever hero earns them; a few belong to the Rogue alone.</li>
            <li><strong>Warrior</strong>: {F.classes.warriorBlurb}</li>
            <li><strong>Rogue</strong>: {F.classes.rogueBlurb} {F.classes.rogue.hpPct}% health, attack {signed(F.classes.rogue.attackPct)}%, defense {signed(F.classes.rogue.defensePct)}%, {signed(F.classes.rogue.goldPct)}% gold from every fight and find, and {F.classes.rogue.raidEdgePct} points on its side of every desk raid. It levels at the Warrior's pace but gets knocked out a little more often.</li>
          </ul>
        </>
      ) : null}
      <h2 id="stances">Stances</h2>
      <p>Choose how careful your hero is on the Hero page.{arrives('stances')} The stance applies from the next adventure, and you can change it at any time. Your TRMNL shows it beside the bag count, under a gauge whose needle sits low for Cautious, in the middle for Balanced and high for Bold.</p>
      <ul>
        <li><strong>Cautious</strong> drinks a potion below 65% HP, rests below 50% and sets off again at 90%. It earns 90% of the usual XP from wins.</li>
        <li><strong>Balanced</strong>, the default, drinks below 50%, rests below 35% and sets off again at 75%, with the usual XP.</li>
        <li><strong>Bold</strong> drinks below 35%, rests below 20% and sets off again at 60%. It earns 115% XP from wins but gets knocked out more often.</li>
      </ul>
      <p>Office Cubicles can't knock a hero out, so Bold has no knockout risk there. On every other floor a knockout costs gold and sends your hero back to Office Cubicles, and Bold is knocked out most often.</p>
      <h2 id="desk-raids">Desk raids</h2>
      <p>While exploring, heroes sometimes raid each other's desks. Every active hero{F.unlocks === undefined ? '' : ` from level ${F.unlocks.raids}`} raids and gets raided automatically. You can't start a raid or pick its target.{F.unlocks === undefined ? '' : ` Below level ${F.unlocks.raids} a hero neither raids nor gets raided.`} The raid shows up in both heroes' adventure logs with the other player's public name, and the Hero page keeps a record of your hero's raids.</p>
      <ul>
        <li>Who wins is a coin toss, moved only by stance. Level, gear and effects never count. Cautious adds 10 points to its side of the toss, Balanced adds nothing and Bold takes 5 away, whether raiding or defending.</li>
        <li>How often your hero raids depends on stance too: Cautious about every other day of exploring, Balanced about once a day, Bold about twice a day.</li>
        <li>The loser hands over 5% of its gold to the winner, so gold only changes hands. Both lose health: the loser 30% of its maximum HP, the winner 10%. Thrifty gear takes its points off the gold loss.</li>
        <li>A raid can knock a hero out, exactly like a fight; in Office Cubicles your hero is rescued instead. Raids only find heroes who are exploring or resting, and a hero raided once is left alone for about six hours.</li>
        <li>If you'd rather lose fewer raids, pick Cautious, which raids least and wins most.</li>
      </ul>
      {F.meetings !== undefined ? (
        <>
          <h2 id="meetings">Meetings</h2>
          <p>Now and then, instead of a fight, your hero runs into another player's hero on the same floor{F.meetings.level === undefined ? '' : `, from level ${F.meetings.level}`}. They grab a coffee, swap war stories or split a sandwich, and both heroes get the same small boon for {F.meetings.boonAdventures} adventures. Both adventure logs tell the story with the other player's public name, and the Log tab lists your hero's last five meetings.</p>
          <ul>
            {F.meetings.kinds.map((kind) => <li key={kind.id}><strong>{kind.name}</strong>: {kind.effect}, {boonLine(kind.modifiers)}.</li>)}
            <li>Nothing changes hands. A meeting takes the place of one adventure, and the boon roughly makes up for it.</li>
            <li>It happens at the same rate whatever your stance or class, about every other day for a hero who is out exploring. Heroes only meet while exploring or resting, and a hero who has just had a meeting is left alone for about twelve hours.</li>
          </ul>
        </>
      ) : null}
      {F.lostProperty ? (
        <>
          <h2 id="lost-property">Lost property</h2>
          <p>When your hero is knocked out outside the Office, it drops a spare of its weapon or armour on that floor, with your public name on it in marker. Your hero keeps everything it was wearing. Later, another player's hero exploring that floor may find the spare instead of an ordinary find, and your TRMNL tells you who found it.</p>
          <ul>
            <li>Your hero can find other players' spares the same way. A spare is ordinary gear: equip it, sell it, salvage it or take it to the workbench. It comes at the plain stats for its kind and rarity, without the first owner's upgrades.</li>
            <li>The name stays on it. The Bag page and the Log tab's Lost property card show whose it was, and so does your hero page while you hold it.</li>
            <li>A spare only replaces a find your hero was about to make anyway, so nobody gets extra gear. Career goals and Christmas presents are always new gear.</li>
            <li>Only one spare of yours lies about at a time. If your hero is knocked out again before anyone finds it, the new spare replaces the old one.</li>
          </ul>
        </>
      ) : null}
      {F.todo !== undefined ? (
        <>
          <h2 id="to-do-list">To-do list</h2>
          <p>Your hero keeps an office to-do list of three small tasks, such as “Defeat 4 Paper Imps”, “Find 2 pieces of gear” or “Explore the Server Room for 16 adventures”.{arrives('todo')} It works through them while exploring, and the Hero page shows each task's progress. When a task is done, your screen says “Ticked off” and your hero gets a little gold: {and(F.todo.pay.map(String), 'or')} depending on the floor. Tasks give no XP, so they don't affect rankings.</p>
          <ul>
            <li>Every morning at {F.todo.standup} your TRMNL's local time, the stand-up gives new tasks for the ones that are done. Your screen lists them.</li>
            <li>Tasks never expire. A stuck task is swapped automatically after two stand-ups.</li>
            <li>At least two of the three tasks can be done where your hero is. At most one asks for a trip to another area, if you want to send your hero there.</li>
            <li>Once between stand-ups you can swap one unfinished task for a different one on the Hero page.</li>
          </ul>
        </>
      ) : null}
      <h2 id="potions">Potions</h2>
      {F.potions === undefined
        ? <p>A healing potion restores 40% of your hero's maximum HP, rounded up. Your hero drinks one automatically when HP falls below the stance's potion level while exploring, and the adventure log notes it. With no potions left, your hero rests below the stance's rest level and sets off again once recovered. You can also drink one yourself from the Hero page whenever your hero is exploring or resting and not at full HP. Potions are found while exploring and never take up bag space.</p>
        : <>
          <p>Potions come in {F.potions.strengths.length} strengths: {and(F.potions.strengths.map((s) => `${s.name.toLowerCase()} (${s.healPct}%)`))}, each restoring that share of your hero's maximum HP, rounded up. Finds depend on where your hero is: {F.potions.drops.map((d) => `the ${d.floor} drop${d.rest.length === 0 ? ' only' : ' mostly'} ${d.top.toLowerCase()}s${d.rest.length === 0 ? '' : `, with some ${d.rest.map((r) => `${r.toLowerCase()}s`).join(' and ')}`}`).join('; ')}. A new hero starts with healing potions, and the merchant and office decisions hand out healing potions too. All strengths share one pouch and never take up bag space.</p>
          <p>Your hero drinks automatically when HP falls below the stance's potion level while exploring: the weakest potion that puts it back above the stance's potion level, or the strongest it has when nothing weaker would do. The adventure log names what it drank. With no potions left, your hero rests below the rest level and sets off again once recovered. You can also drink one yourself from the Hero page whenever your hero is exploring, resting or travelling and not at full HP; with more than one strength in the pouch, the Hero page asks which.</p>
          <p><strong>Combining.</strong> On the Bag page, {F.potions.combine.count} {F.potions.combine.from.toLowerCase()}s and {F.potions.combine.materials.map((m) => `${m.n} ${m.name}`).join(', ')} become one {F.potions.combine.to.toLowerCase()}. Combining never leaves you with more potions than before, so the pouch can't overflow. It only happens when you choose it.</p>
        </>}
      <p>Potions are kept in a pouch. A new hero carries a {F.firstPouch.name} that holds {F.firstPouch.size}. Bigger pouches are bought with gold on the Bag page, one at a time: {rungs(F.shopPouches)}. When the pouch is full, a potion find becomes gold instead.</p>
      <h2 id="the-wandering-merchant">The wandering merchant</h2>
      <p>Now and then your hero meets a wandering merchant while exploring. Your screen says “Merchant visiting. Shop in the companion soon.” and the Bag page shows up to three offers: a few potions, and the next pouch or bag{F.merchantOff > 0 ? ` at ${F.merchantOff}% off the Bag page price` : ''}. Each offer sells once. The merchant moves on after four adventures or after your last purchase.</p>
      <h2 id="decisions">Decisions</h2>
      <p>Sometimes the office asks your hero something small, like chipping in for a cake or staying late. Your screen says “A decision is waiting in the companion.” and the Hero page shows both options with exactly what each one changes. If you don't answer within about a day, the option marked as the default is chosen for you.</p>
      <h2 id="effects">Effects</h2>
      <p>Some moments leave your hero with a short effect, listed on the Hero page with the adventures it has left. Beating an elite makes your hero Fired up (+10% attack for eight adventures). Chipping in for cake makes your hero Well fed (+10% XP for eight adventures). A trap leaves your hero Bruised (−15% defense for four adventures). Your hero holds at most three effects. Any rest shakes off bad effects, and a knockout clears them all.</p>
      {F.standoff !== undefined ? (
        <>
          <h2 id="dug-in-elites">Dug-in elites</h2>
          <p>From level {F.standoff.minLevel}, on the {F.standoff.floor} and deeper floors, an elite sometimes digs in instead of falling in one fight. Your TRMNL shows it with its health bar, and your hero comes back to it every adventure until it falls.</p>
          <ul>
            <li>Each adventure your hero fights it for up to six rounds, and its health carries over. It hits much harder than an ordinary elite, and your hero fights on past its stance's rest line before stepping back, so a standoff can end in a knockout. No gold is lost for breaking off.</li>
            <li>When it falls, it pays {F.standoff.xp} times the monster's XP and {F.standoff.gold} times its gold, plus a rare or epic find from that floor.</li>
            <li>It leaves after {F.standoff.hours} hours, or sooner if your hero is knocked out or travels. A pause doesn't stop the clock.</li>
            <li>The Hero page shows its health and when it leaves. You can walk away from it there, and travel asks before leaving it behind.</li>
          </ul>
        </>
      ) : null}
      {F.occasions !== undefined ? (
        <>
          <h2 id="office-calendar">Office calendar</h2>
          <p>Holidays and office occasions dress your hero's scene for the day: decorations along the ceiling, something on the floor, sometimes a hat, and in the Office Cubicles a different view from the window. They follow your TRMNL's local date. The first time your hero sees one, the adventure log names it, and most bring one small bonus while they last. The Hero page shows today's occasion and the next one.</p>
          <ul>
            {F.occasions.map((rule) => <li key={rule.id}><strong>{rule.name}</strong>, {occasionDate(rule)}: {rule.id === 'friday_13th' ? 'every desk raid goes wrong (below).' : rule.effectLabel ? `${rule.effectLabel}.` : 'decorations only.'}</li>)}
          </ul>
          <p><strong>Friday the 13th.</strong> Desk raids start twice as often, and every one of them goes wrong: nobody wins, and both heroes lose 20% of their maximum HP and 5% of their gold, which nobody gets. Your hero's raid record counts it as a mishap.</p>
          <p><strong>Christmas.</strong> Your hero finds one wrapped gift each Christmas: a piece of gear from the floor it's on, on its first adventure of the three days.</p>
        </>
      ) : null}
      <h2 id="rare-and-epic-gear">Rare and epic gear</h2>
      <p>Gear comes as common, uncommon, rare or epic. Epic gear is the rarest, about one find in a hundred, and the strongest. Rare and epic gear also carry one special trait, shown in the item's name and explained on the Bag page:</p>
      <ul>
        <li><strong>Vampiric</strong> heals 5% of maximum HP after every win.</li>
        <li><strong>Lucky</strong> adds 20% gold from wins and finds.</li>
        <li><strong>Sturdy</strong> takes 40% less damage from traps.</li>
        <li><strong>Thrifty</strong> loses 5 points less gold when things go wrong: a retreat loses no gold instead of 5%, and a knockout loses 5% instead of 10%.</li>
      </ul>
      <h2 id="when-your-bag-fills-up">When your bag fills up</h2>
      <p>A new hero starts with a small paper bag that holds 6 pieces of gear. Equipped gear and potions don’t take up space. When the bag is full, your hero holds the next piece it finds for you and keeps adventuring. While that piece waits, further finds stay behind until you make room.</p>
      <h2 id="bigger-bags">Bigger bags</h2>
      <p>Your bag grows with gold. {F.tote ? `Your hero finds a ${F.tote.name} (${F.tote.size}) within the first couple of hours. ` : ''}After that, bigger bags are bought on the Bag page, one at a time: {rungs(F.shopBags)}, up to {F.topBag} slots. There are no level requirements, and bags never drop as loot.</p>
      <ol className="[&_li]:list-decimal">
        <li>Open Bag in the companion. Equip any upgrades and sell spare gear to free space.</li>
        <li>If a find is being held, choose Claim find. Leave at least one free slot after claiming it so adventures can resume.</li>
        <li>Once a slot is free and nothing is waiting, adventures resume on their own within 15 minutes. You can still pick another unlocked area from the bag page before then.</li>
      </ol>
      <p>Equipping gear does not free a slot. Selling or salvaging gear, or buying a bigger bag, does, and the held find moves into the bag at once. The Bag page can also sell your weakest spare and keep the find in one tap. Your TRMNL’s Sleep Mode never stops the game either.</p>
      {F.workbench !== undefined ? <>
        <h2 id="salvage-and-the-workbench">Salvage and the workbench</h2>
        <p>{F.workbench.level !== undefined ? `From level ${F.workbench.level}, s` : 'S'}pare gear has two ways out of the bag: sell it for gold, or salvage it for materials on the Bag page. Salvage pays the tier the piece was found at, in units of its rarity’s material: {F.workbench.materials.map((m) => `${m.name} from ${m.rarities.join(' and ')} gear`).join(', ')}. Epic gear pays {F.workbench.epicMultiplier} times as much. Materials take no bag space and are never sold. Gear is only salvaged when you choose to.{F.workbench.level !== undefined ? ` Before level ${F.workbench.level}, sell your spares: the first upgrade needs level ${F.workbench.level} anyway.` : ''}</p>
        <p>The workbench spends materials and gold on the gear your hero wears, in place: the piece keeps its name and trait, and only its numbers change. Each piece has one next step. {F.workbench.tiers.map((s, i) => `${i === 0 ? 'Raising a tier-1 piece to Mk II' : 'Mk II to Mk III'} costs ${price(s)}`).join('; ')}; a piece can only be raised to a tier your hero’s level could equip. Once a piece is Mk III (or was found there), reinforcement adds one point a step: {F.workbench.reinforce.map((s) => `+${s.to} for ${price(s)}`).join(', ')}. {F.workbench.reinforce.length > 0 ? `After +${F.workbench.reinforce.at(-1)!.to} the piece is finished.` : ''} Rare and epic gear can also have a trait of your choosing fitted for {price(F.workbench.affix)}, replacing the one it has.</p>
        <p>Upgrades always succeed. Salvaging an upgraded piece doesn't return what you spent upgrading it, so only upgrade gear you plan to keep wearing.</p>
      </> : null}
      <h2 id="getting-knocked-out">Getting knocked out</h2>
      <p>Your hero revives automatically after about two hours and returns to Office Cubicles. You keep your XP and equipment but lose 10% of your current gold.</p>
      <h2 id="recaps">Recaps</h2>
      <p>Your screen carries a short recap of the last finished night or day, in your TRMNL's local time. At 07:00 the night recap reports 19:00 to 07:00 and stays up all day. At 19:00 the day recap reports 07:00 to 19:00 and stays up all evening and overnight. The office window shows day and night on the same hours. The stories above it are always the latest.</p>
      <h2 id="understanding-rankings">Understanding rankings</h2>
      <p>The screen shows this week’s XP Top 5 for your level group, with your own row marked, or added below the list when you sit lower. The companion also offers today’s board and a lifetime board. Today starts at 00:00 UTC and the week on Monday at 00:00 UTC, as keepsakes do. Rankings publish hourly, so a recent adventure or level-up can appear before your rank updates.</p>
      <p>Paused and sleeping heroes keep their progress. One with no XP this week leaves the weekly board until it earns XP again. Lifetime progress stays recorded.</p>
      <h2 id="sharing-your-hero">Sharing your hero</h2>
      <p>Your hero has a public page with its level, rank, current floor, lifetime counts and achievements. Gold and the adventure log are never shown, and gear only when it's another player's spare your hero is holding. Your name links to the page from the rankings and from other players' raids and meetings, and that's where other players follow you. Settings has Share and Copy link buttons, and a shared link shows a picture card of your hero with its name, level and rank. To hide it, choose Hide my hero page in Settings. It goes straight away, and while it's hidden nobody can follow you or name you their rival.</p>
      <h2 id="following-and-rivals">Following and rivals</h2>
      <p>Signed in, you can follow another player from their public hero page, up to 20 players. Everyone you follow is listed under Rankings, with their hero's level, rank and where they are, and links to their pages. Mark one of them as your rival to keep them at the top of the list with a line saying who is ahead. Your rival also gets raided more: half your hero's raids go after their desk when they can be raided. Your rival is told who named them and can name you back. Following anyone else changes nothing in play, and nobody is told when you follow them. If a player hides their page, you see only their name until they show it again. If they change their public name, they drop off your list.</p>
      <h2 id="names">Names</h2>
      <p>You have two names. Your hero's name is on your TRMNL, the rankings and your hero page; to change it, buy a “Hi, my name is” name tag on the More tab for 200 gold. One is in stock a day. Your public name is you, across every TRMNL game: it shows beside your hero in the rankings, in other players' raids and meetings, and in your page's link. You can change it for free once every 7 days from Account. Links to your old page stop working, and nobody else can take your old name for 7 days.</p>
      <h2 id="gender">Gender</h2>
      <p>You pick your hero's gender, male or female, when you create it. It only changes how your hero looks on your TRMNL, your hero page and in other players' meetings. Both play the same. To change it later, buy a makeover on the More tab for 200 gold, any time.</p>
      <h2 id="alerts">Alerts</h2>
      <p>Your TRMNL is the main way to keep up with your hero, but Settings can also send a phone notification in two cases, each off until you turn it on:</p>
      <ul>
        <li><strong>Bag full:</strong> the bag is full and your hero is holding a find for you. It comes half an hour after the bag fills, so nothing arrives if you are already sorting it out, and once each time it fills.</li>
        <li><strong>Merchant deal:</strong> a merchant is selling the next bag or pouch{F.merchantOff > 0 ? ` at ${F.merchantOff}% off` : ''} and your hero has the gold. At most once a day. A merchant with only potions never sends one.</li>
      </ul>
      <p>You get at most two alerts a day. Quiet hours run from 21:00 to 08:00 unless you change them: a bag-full alert waits until they end, and a merchant deal that turns up then is skipped. Before sending, the game checks that the alert still holds, so you never hear about a bag you have already sorted or an offer that has gone. Decisions, raids, knockouts, level-ups and keepsakes never send alerts.</p>
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
        <li>"Updates delayed" means the game service is running late. Your hero's progress is kept, and the screen catches up once the service does.</li>
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
    </>
  ),
}
