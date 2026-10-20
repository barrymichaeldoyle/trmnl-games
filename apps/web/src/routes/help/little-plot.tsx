import { createFileRoute } from '@tanstack/react-router'
import { ACTIVE_CONTENT, catalogs } from '@trmnl-games/little-plot/content'
import { requireOpenGame } from '../../lib/gameAccess'
import { ProsePage, SUPPORT_EMAIL } from '../../lib/prose'
import { seo } from '../../lib/seo'

const content = catalogs[ACTIVE_CONTENT]

const CONTENTS: ReadonlyArray<readonly [string, string]> = [
  ['getting-started', 'Getting started'],
  ['how-the-plot-grows', 'How the plot grows'],
  ['seasons-and-weather', 'Seasons and weather'],
  ['picking-and-seeds', 'Picking and seeds'],
  ['crossing', 'Crossing'],
  ['pests-and-gnomes', 'Pests and gnomes'],
  ['other-gardens', 'Other gardens'],
  ['the-shed', 'The shed'],
  ['goals-and-levels', 'Goals, levels and rankings'],
  ['pressed-flowers', 'Pressed flowers'],
  ['your-screen', 'Your screen'],
  ['pausing-and-removing', 'Pausing and removing'],
  ['help', 'Help'],
]

const hours = (ticks: number) => ticks / 4
const price = (id: string) => content.items.find((i) => i.id === id)!.price

/** Little Plot help (little-plot.md "Companion"). Hidden with the game until it is live (D206). English for now; the eight languages follow the Idle Angler pattern (D200) before review. */
export const Route = createFileRoute('/help/little-plot')({
  loader: ({ context }) => requireOpenGame(context, 'little-plot'),
  head: () => seo({ title: 'Little Plot help', path: '/help/little-plot', description: 'How Little Plot works on your TRMNL: beds that grow on their own, seeds, crossing, pests, gnomes from other gardens and the shed.', index: false }),
  component: () => (
    <ProsePage title="Little Plot on TRMNL" contents={CONTENTS}>
      <h2 id="getting-started">Getting started</h2>
      <ul>
        <li>Install Little Plot from the TRMNL plugin marketplace and choose Install.</li>
        <li>Sign in to TRMNL Games and connect the installation. Four beds are sown for you: Marigold, Lettuce, Radish and Nasturtium.</li>
        <li>Back in TRMNL, click Save. The beds start growing within fifteen minutes.</li>
        <li>Add the plugin to a playlist or a mashup. All four layout sizes are supported in both orientations.</li>
      </ul>
      <h2 id="how-the-plot-grows">How the plot grows</h2>
      <p>Every quarter of an hour each bed gains a little growth, whether or not anyone is looking. A plant goes through five stages: sown, sprout, in leaf, in bud and ripe. A common plant takes about six to ten hours; an uncommon one twelve to eighteen; rares a day or so; epics two to three days.</p>
      <p>Watering is a boost, never a requirement. The tin can waters the plot for four hours and a bigger can for longer; a watered bed grows half as fast again. Rain waters the plot for free. A dry plot still grows, and nothing ever wilts.</p>
      <p>A ripe bed waits for you. Left alone for a day, it goes to seed: one seed of its kind into the tin and the bed resows itself. One such volunteer in twelve comes up as a different common kind, something the wind brought in, so a plot nobody visits still meets new plants. The only thing an absent player loses is the coins.</p>
      <h2 id="seasons-and-weather">Seasons and weather</h2>
      <p>The plot sits by the Millpond and shares its weather with Idle Angler’s anglers: the same rain on both screens. The seasons are the world’s, one a week on a four-week year, turning on Mondays, so a whole year passes in a month.</p>
      <ul>
        <li><strong>Spring</strong> is sowing season: every kind can be sown. <strong>Summer</strong> grows fastest.</li>
        <li><strong>Autumn</strong> pays a fifth more at harvest, and pumpkins and gourds only ripen in autumn or under glass.</li>
        <li><strong>Winter</strong> is slow. On a clear winter night there is frost: tender plants pause, hardy ones (chives, mint, pansies, spinach, rosemary, thyme) keep going. A seed sown out of its season grows at half speed until its season comes; nothing dies.</li>
      </ul>
      <h2 id="picking-and-seeds">Picking and seeds</h2>
      <p>Tap a ripe bed on the Plot page to pick it. Picking pays its coins at once and puts seeds of its kind in the tin: two for a common, one for anything rarer, and one more if you catch it within a couple of hours of ripening. The tin holds twenty seeds of a kind. Tap an empty bed to sow from the tin.</p>
      <h2 id="crossing">Crossing</h2>
      <p>Two kinds growing side by side can cross. When a plant ripens and one of its four neighbours is in bud or ripe, and the two form a known pair, there is a one in four chance the ripe bed sets a seed of the child kind (the beehive doubles it). The bed shows a star, and picking it returns the child’s seed. Every rare and epic plant comes this way, or from the gnome trap and the frost; the shed never sells one.</p>
      <p>The catalogue gives each ungrown cross a riddle. Once you have grown one parent it names it; once both, it names both. The pairs are the same for everyone, so it is fair to share them.</p>
      <h2 id="pests-and-gnomes">Pests and gnomes</h2>
      <p>At night, mostly, something comes for the garden: slugs, aphids, birds, a fox or a gnome. A pest sets a bed back a stage or two, slows it for a while, or takes a spare seed from the tin. It never destroys a plant. Defences from the shed lower each pest’s chance: copper tape for slugs, netting for birds, a fence for the fox, a lantern, a scarecrow and the garden cat for gnomes. The gnome trap catches a gnome two times in five; a caught gnome gives everything back and sometimes drops a seed of its own.</p>
      <h2 id="other-gardens">Other gardens</h2>
      <p>Now and then the gnome in the night is another player’s. It takes one spare seed, a common or uncommon kind you have at least two of, never the last one and never a rare, and the seed turns up in their tin with your name on it. Your own gnome calls on other gardens the same way. Only plots with a public page are in the pool; hide your plot on the More page and no gnome calls either way. A trapped visiting gnome drops a seed from its own garden.</p>
      <p>You can also send a cutting: one seed a day, any kind, to a player you follow whose plot is public.</p>
      <h2 id="the-shed">The shed</h2>
      <p>Common seeds from level {content.unlocks.seeds}, uncommon from level {content.unlocks.uncommonSeeds}, defences from level {content.unlocks.defences} and structures from level {content.unlocks.structures}. Beds come in three steps, to six ({price('beds_6')} coins), nine ({price('beds_9')}) and twelve ({price('beds_12')}). The greenhouse ({price('greenhouse')}) puts one bed under glass, which ignores the season and the frost.</p>
      <h2 id="goals-and-levels">Goals, levels and rankings</h2>
      <p>One goal at a time leads you through the game; a reached goal pays through the Claim button on the Plot page. Every ripening earns XP, double the first time a kind ripens, and levels follow. Rankings show Today, This week and Lifetime by level group, as Desk Crawler’s do.</p>
      <h2 id="pressed-flowers">Pressed flowers</h2>
      <p>Your TRMNL shows a six-digit code each week. Enter it on the More page to press one flower into the book; the newest hangs in the shed window on the device. One a week, last week’s code still works, and a missed week costs nothing.</p>
      <h2 id="your-screen">Your screen</h2>
      <p>The device shows the plot from above with the sky for your local time of day, the weather and the season on the hedge, your level, the season line, how many beds are ripe, the newest stories, this week’s Top 5 and a code to the companion. When half the beds are ripe the screen says so.</p>
      <h2 id="pausing-and-removing">Pausing and removing</h2>
      <p>Pause on the More page: nothing grows, nothing visits, nothing is lost. Removing the plugin from TRMNL keeps your plot; deleting Little Plot progress on the More page removes the plot, the tin, the catalogue, the achievements and the pressed flowers, and leaves your account and other games alone.</p>
      <h2 id="help">Help</h2>
      <p>Something odd? Write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
    </ProsePage>
  ),
})
