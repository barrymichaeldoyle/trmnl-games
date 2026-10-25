import { createFileRoute } from '@tanstack/react-router'
import { ACTIVE_CONTENT, catalogs } from '@trmnl-games/pixel-wars/content'
import { requireOpenGame } from '../../lib/gameAccess'
import { ProsePage, SUPPORT_EMAIL } from '../../lib/prose'
import { seo } from '../../lib/seo'

const content = catalogs[ACTIVE_CONTENT]

const CONTENTS: ReadonlyArray<readonly [string, string]> = [
  ['getting-started', 'Getting started'],
  ['the-map', 'The map and your desk'],
  ['ink-and-orders', 'Ink and orders'],
  ['the-fade', 'The fade'],
  ['your-desk', 'When your desk falls'],
  ['the-night-shield', 'The night shield'],
  ['the-bell', 'The bell and the print'],
  ['sides', 'Sides and invites'],
  ['goals-and-levels', 'Goals, levels and rankings'],
  ['your-screen', 'Your screen'],
  ['removing', 'Removing'],
  ['help', 'Help'],
]

const hours = (ticks: number) => ticks / 4

/** Pixel Wars help (pixel-wars.md "Companion"). Hidden with the game until it is live (D214). English for now; the eight languages follow the Idle Angler pattern (D200) before review. */
export const Route = createFileRoute('/help/pixel-wars')({
  loader: ({ context }) => requireOpenGame(context, 'pixel-wars'),
  head: () => seo({ title: 'Pixel Wars help', path: '/help/pixel-wars', description: 'How Pixel Wars works on your TRMNL: every desk a cell on a shared map, four factions, ink that fades, orders that resolve on the quarter-hour and a week that ends as a print.', index: false }),
  component: () => (
    <ProsePage title="Pixel Wars on TRMNL" contents={CONTENTS}>
      <h2 id="getting-started">Getting started</h2>
      <ul>
        <li>Install Pixel Wars from the TRMNL plugin marketplace and choose Install.</li>
        <li>Sign in to TRMNL Games and connect the installation. Back in TRMNL, click Save.</li>
        <li>Pick a side in the companion. Your desk takes its place on the map within fifteen minutes.</li>
        <li>Add the plugin to a playlist or a mashup. All four layout sizes are supported in both orientations.</li>
      </ul>
      <h2 id="the-map">The map and your desk</h2>
      <p>Every player’s desk is one cell on a map every player’s TRMNL shows. Desks sit on a grid with two cells of ground between neighbours, so there is always ground to fight over. Everything else is ground until someone paints it. The map grows a ring at a time as players join.</p>
      <p>Four factions share the map: {content.factions.map((f) => f.name).join(', ')}. Each is drawn as a pattern the e-ink can show, never a colour, and the companion paints the same patterns in colour.</p>
      <h2 id="ink-and-orders">Ink and orders</h2>
      <p>Ink arrives at {content.dropsPerTick * 4} drops an hour into a well that holds {content.wellCap}. Nothing else grants ink. You spend it on orders in the companion, and nothing happens when you place one: every quarter of an hour the world resolves every order on the map at once, then your screen shows the result.</p>
      <ul>
        <li><strong>Paint</strong> a ground cell beside one your faction holds: one drop, and the cell is yours at ink 1.</li>
        <li><strong>Stamp</strong> a cell your faction holds: one drop per point of ink, to {content.cellInkCap} on ground and {content.deskInkCap} on a desk.</li>
        <li><strong>Strike</strong> a cell another faction holds, beside one of yours: each drop takes one point of its ink, and the drops past zero claim it for you. A full cell costs {content.cellInkCap + 1} drops to take.</li>
        <li><strong>Liberate</strong> your own desk while another faction holds it, from anywhere on the map: every drop counts {content.liberateMultiplier}.</li>
      </ul>
      <p>Orders are checked against the map as it stood when the tick began. If a target changed hands first, the drops come back. You can cancel a queued order until its tick is read.</p>
      <p>Two factions striking the same cell add up; whoever brought the most takes it, and a tie leaves it ground. The smallest faction’s strikes against the largest count {content.underdogMultiplier} times, and a cell the largest faction takes from the smallest starts at ink 1 however many drops it spent.</p>
      <h2 id="the-fade">The fade</h2>
      <p>Ink fades. Every cell loses one point now and then, and the largest faction fades fastest: a full cell stands about {hours(content.fadeTicksByRank[0]! * content.cellInkCap)} hours untended when your side leads, {hours(content.fadeTicksByRank[3]! * content.cellInkCap)} when it is smallest. Desks fade at half that rate. A cell at zero ink is ground again. The fade is drawn on the screen as thinner strokes, so the map is honest about who is really defending what, and a faded border is the cheapest ground on the map.</p>
      <h2 id="your-desk">When your desk falls</h2>
      <p>When another faction takes your desk, its pattern fills your own screen until your side takes it back. That is cheap: your own drops count {content.liberateMultiplier} on your own desk and need no neighbour. A faction-mate can take it back too. A desk that fades all the way to ground is still your desk; a paint by you puts it back at once.</p>
      <h2 id="the-night-shield">The night shield</h2>
      <p>A desk cannot be taken between {content.shield.fromHour}:00 and {content.shield.toHour}:00 by its owner’s clock, read from the TRMNL that shows it. Strikes against a shielded desk are refused when you place them. Ground has no shield, and a desk already lost can be liberated at any hour.</p>
      <h2 id="the-bell">The bell and the print</h2>
      <p>A season is one week, Monday to Monday at 00:00 UTC. The side that held the most ground for the longest wins the week, not the one holding the most at the bell. At the bell the final map is kept as a print for everyone who held a desk, every player of the winning side who placed an order that week earns {content.xp.seasonWon} XP, and the map is painted clean: every cell to ground, every desk back to its side at full ink, every well filled.</p>
      <h2 id="sides">Sides and invites</h2>
      <p>You pick a side when you join. The smallest side is marked, and a side holding more than {content.fullFactionPercent}% of the desks is closed to new players for the week. A friend who joins by your invite link lands beside your desk, on your side, whatever its share. In the hour after the bell you may switch sides, once a season.</p>
      <p>A desk whose screens have shown the map for none of the last {content.clearAfterDays} days stands empty until one does.</p>
      <h2 id="goals-and-levels">Goals, levels and rankings</h2>
      <p>One goal at a time leads you through the game and pays its XP when it is met. Every hour you earn {content.xp.heldCellPerHour} XP for each cell your ink is on, {content.xp.deskFullHour} more while your desk is full, {content.xp.flip} for each cell you take, {content.xp.deskTaken} for a desk taken and {content.xp.liberatedOwn} for liberating your own. Rankings show Today, This week and Lifetime by level group, as Desk Crawler’s do.</p>
      <h2 id="your-screen">Your screen</h2>
      <p>The device shows the map (the whole of it when it fits, else a window around your desk), the four sides’ shares and the hour’s movement, your desk, your well and the cells you hold, the map’s latest lines, your own stories, this week’s Top 5 and a code to the companion. When your desk falls the screen says so first.</p>
      <h2 id="removing">Removing</h2>
      <p>Removing the plugin from TRMNL keeps your desk; deleting Pixel Wars progress on the More page removes the desk, its stories, queued orders and achievements, leaves its place on the map as empty ground, and leaves your account and other games alone.</p>
      <h2 id="help">Help</h2>
      <p>Something odd? Write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
    </ProsePage>
  ),
})
