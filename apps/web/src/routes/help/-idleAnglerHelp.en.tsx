import { anglerWords } from '@trmnl-games/idle-angler/i18n'
import { SUPPORT_EMAIL } from '../../lib/support'
import { IA_FACTS as F, type HelpPage } from './-idleAnglerHelp'
import { IDLE_ANGLER_HELP_HEAD } from './-helpHeads'

const w = anglerWords('en')

export const en: HelpPage = {
  seoTitle: IDLE_ANGLER_HELP_HEAD.en.seoTitle,
  description: IDLE_ANGLER_HELP_HEAD.en.description,
  title: 'Idle Angler on TRMNL',
  contents: {
    'getting-started': 'Getting started',
    goals: 'Goals and what opens when',
    'how-fishing-works': 'How fishing works',
    'time-and-weather': 'Time, weather and seasons',
    bait: 'Bait and deadbait',
    'the-fishmonger': 'The fishmonger',
    'the-cooler': 'The cooler',
    'rods-and-fish-that-get-away': 'Rods and fish that get away',
    waters: 'Waters',
    'the-logbook': 'The logbook and titles',
    rankings: 'Rankings and weekend Opens',
    'the-trophy-wall': 'The trophy wall',
    'the-fly-box': 'The fly box',
    achievements: 'Achievements',
    alerts: 'Alerts',
    'pausing-and-removing': 'Pausing and removing',
    help: 'Help',
  },
  Body: () => (
    <>
      <h2 id="getting-started">Getting started</h2>
      <ul>
        <li>Install Idle Angler from the TRMNL plugin marketplace and choose Install.</li>
        <li>Sign in to TRMNL Games and connect the installation. Your angler uses your public name.</li>
        <li>Back in TRMNL, click Save. Within fifteen minutes your angler casts for the first time and lands a fish.</li>
        <li>Add the plugin to a playlist or a mashup. All four layout sizes are supported in both orientations.</li>
      </ul>
      <h2 id="goals">Goals and what opens when</h2>
      <p>The Dock always shows one goal, such as "{w.goal('first_sale')}" or "{w.goal('dawn_dusk')}". Reaching it sets a few coins aside: press Claim on the Dock to collect them, and the next goal appears. A dot on the Dock tab tells you one is waiting. Goals never expire, and your angler reaches about half of them without you.</p>
      <p>The game opens up as your logbook fills: rod and cooler upgrades at {F.unlocks.shop_upgrades} species, fishmonger orders at {F.unlocks.orders}, the weekend Opens at {F.unlocks.opens}, the trophy wall at {F.unlocks.trophies} and deadbait at {F.unlocks.deadbait}. The Dock says what is coming up next.</p>
      <h2 id="how-fishing-works">How fishing works</h2>
      <p>Every fifteen minutes, day and night, your angler casts once. Sometimes a fish bites. Which fish depends on the water, the bait, the time of day and the weather. Its weight decides its price, whether it is a personal best and where it lands on the boards. Your TRMNL shows the scene, the latest stories and this week's board for your water. Open the companion to sell your catch, buy bait or move to another water.</p>
      <h2 id="time-and-weather">Time, weather and seasons</h2>
      <p>Dawn runs from 05:00 to 08:00, day to 17:00, dusk to 20:00, then night, in the timezone your TRMNL reports. Fish feed more at dawn and dusk. Weather is the same for every angler at a water and changes every six hours: clear, overcast, rain, wind or fog. Overcast and rain bring more bites at {w.water('river_bend')}, wind brings fewer, and fog makes dawn and dusk dark enough for night fish.</p>
      <p>The waters have their own seasons, the same for everyone: spring, summer, autumn and winter, one week each, changing every Monday at 00:00 UTC. Some fish feed only in one season, freshwater bites slow in winter, and the scene shows blossom, leaves or snow. Each season has a run, Monday to Thursday, when one fish is in: {F.runs.map((id) => w.species(id)).join(', ')}.</p>
      <h2 id="bait">Bait and deadbait</h2>
      <p>Each water takes its own baits, and the bait decides which fish can bite; the Shop says which fish take each one. Choose the bait to fish with on the Dock page. Each fish you keep, or that gets away, uses one bait. A cast with no bite uses none, and neither does a fish released from a full cooler. With no bait for the water the angler fishes a bare hook, which gets fewer bites and only small fish. Buy bait in tubs in the Shop, up to {F.baitCap} of each; bait never spoils.</p>
      <p>Small fish, such as roach, dace, bleak and mackerel, can go back on the hook as deadbait from the cooler: one fish gives {F.deadbaitPerFish} baits, up to {F.deadbaitCap} held. Only predators take deadbait, such as perch, pike, zander, eels and the big sea fish, and they run heavier on it.</p>
      <h2 id="the-fishmonger">The fishmonger</h2>
      <p>The fishmonger posts {F.orderSlots} orders, such as "Two Roach" or "One fish over 1.5 kg". When fish in your cooler fit an order, the fishmonger appears on the Cooler page with those fish and a Sell button: he pays 1.5× their market price plus a bonus, and the page shows both prices. Orders never expire, and an empty slot refills at 07:00 your time. Your angler cannot choose its catch, so the fishmonger only shows up when there is something to sell him.</p>
      <h2 id="the-cooler">The cooler</h2>
      <p>Fish go in the cooler until you sell them. When it is full the angler keeps fishing and releases what it catches. Released fish still go in the logbook, count for achievements and can top the boards, but earn no coins. Your TRMNL says when the cooler is full, and its QR code opens the cooler. A bigger cooler means fewer released fish between visits. The game never sells fish for you.</p>
      <h2 id="rods-and-fish-that-get-away">Rods and fish that get away</h2>
      <p>Each rod lands fish up to a weight. A heavier fish breaks free, and the story says something heavy got away. A better rod would have landed it. Better rods also get a few more bites.</p>
      <h2 id="waters">Waters</h2>
      <ul>
        <li><strong>{w.water('millpond')}</strong>: where everyone starts. Roach, perch and bream, carp at dawn and dusk, eels at night.</li>
        <li><strong>{w.water('river_bend')}</strong>: opens once {F.gates.river_bend} {w.water('millpond')} species are in your logbook, with the {w.pass('waders')}. Trout, chub and barbel, and pike and zander on the spinner.</li>
        <li><strong>{w.water('harbour_pier')}</strong>: opens once {F.gates.harbour_pier} {w.water('river_bend')} species are in your logbook, with the {w.pass('pier_permit')}. Sea fish, bigger and worth more. Most need the {w.rod('Carbon Rod')} or better.</li>
        <li><strong>{w.water('heron_lake')}</strong>: opens once {F.gates.heron_lake} {w.water('river_bend')} species are in your logbook, with the {w.pass('rowing_boat')}. Big carp on boilies, and catfish on summer nights.</li>
        <li><strong>{w.water('deep_sea')}</strong>: opens once {F.gates.deep_sea} {w.water('harbour_pier')} species are in your logbook. A ticket from the Shop buys {F.charter.casts} casts at sea for {F.charter.price} coins; the boat brings you back to the pier when they run out, and casts you do not use stay on the ticket. The biggest fish need the {w.rod('Boat Rod')}.</li>
        <li><strong>{w.water('frozen_tarn')}</strong>: opens once {F.gates.frozen_tarn} {w.water('heron_lake')} species are in your logbook, with the {w.pass('ice_auger')}, and only in the winter week. When the ice goes out the angler walks back to {w.water('heron_lake')}.</li>
      </ul>
      <p>Moving skips one cast, then the angler fishes the new water. If the bait you are using does not work there, the angler switches to the bait you hold most of that does. You can move back at any time.</p>
      <h2 id="the-logbook">The logbook and titles</h2>
      <p>Every species you land is logged with its count and your best weight, and the logbook says which bait, hours and weather it takes. Fish you have not caught show as silhouettes with their bait, except the epics. Epic fish need the right bait, hour and weather together, and some only feed in one season.</p>
      <p>The logbook is how you progress. New species open the next water and the features above, and they earn your title: {F.titles.map((t) => `${w.title(t.id)} at ${t.species} species`).join(', ')}. Everyone starts as a {w.title(F.firstTitle)}. Idle Angler has no XP or levels.</p>
      <p>Each water has its own rank too: {F.ranks.map((r) => w.lang.waterRanks[r]).join(', ')}, climbing with the share of that water’s species you have logged. {w.lang.waterRanks.master} needs every species there, the season visitors and the epic included. Your TRMNL shows your rank at the water you are fishing, with ticks for the species it still needs.</p>
      <h2 id="rankings">Rankings and weekend Opens</h2>
      <p>Each water has its own board: the heaviest fish each angler has landed there, kept or released. One board runs for the week and starts again every Monday at 00:00 UTC; the other keeps the all-time records. Your TRMNL shows this week's board for the water you are fishing, and the companion shows them all.</p>
      <p>Every weekend, from Saturday 00:00 to Sunday 23:59 UTC, each water holds an Open for one fish, named on the Rankings page. Land that fish there to enter; your heaviest one counts. On Monday the top three at each water take a medal and {F.prizes.join(', ')} coins, and everyone who entered gets a rosette.</p>
      <h2 id="the-trophy-wall">The trophy wall</h2>
      <p>A fish of at least {F.trophies.minPercent}% of its species' top weight can be mounted from the cooler instead of sold. Mounting costs the fish's value plus {F.trophies.fee} coins. The wall starts with {F.trophies.firstPegs} pegs and takes up to {F.trophies.maxPegs}; more pegs are on the wall's page. Medals and rosettes sit on the shelf, and your public page shows the wall when it is public.</p>
      <h2 id="the-fly-box">The fly box</h2>
      <p>Each week your TRMNL shows a six-digit fly code beside its QR code and in its title bar. Scan the QR code, or type the code on the Log page, to add that week's fly to your box. Your angler wears the newest fly on their hat. One fly a week: a new code arrives every Monday at 00:00 UTC, and last week's code still works until the next Monday in case your screen refreshed late. After all {F.flies} flies, the designs come round again. Flies change nothing about fishing.</p>
      <h2 id="achievements">Achievements</h2>
      <p>Achievements come in tiers, for fishing, the logbook, your tackle and waters, trading, and each species. The Achievements page under More shows the tiers you have, the share of anglers who have each one and how far you are from the next. Your public profile shows them when Idle Angler is on it.</p>
      <h2 id="alerts">Alerts</h2>
      <p>Turn on alerts under Settings on the More page to get a notification on that phone when your cooler fills or your angler runs out of bait. They are off until you turn them on, and you get at most two a day across all your games.</p>
      <h2 id="pausing-and-removing">Pausing and removing</h2>
      <p>Pause fishing under Settings on the More page: no catches until you resume, and you keep everything. Removing the plugin from TRMNL keeps your angler. Deleting Idle Angler progress under Settings removes your angler, cooler and logbook and leaves your account and your other games alone.</p>
      <h2 id="help">Help</h2>
      <p>Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with what your screen shows and when you last saw it change.</p>
    </>
  ),
}
