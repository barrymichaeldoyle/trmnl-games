import { createFileRoute } from '@tanstack/react-router'
import { ACTIVE_CONTENT, catalogs } from '@trmnl-games/paper-lives/content'

const content = catalogs[ACTIVE_CONTENT]
import { requireOpenGame } from '../../lib/gameAccess'
import { ProsePage, SUPPORT_EMAIL } from '../../lib/prose'
import { seo } from '../../lib/seo'

const CONTENTS: ReadonlyArray<readonly [string, string]> = [
  ['getting-started', 'Getting started'],
  ['how-a-year-works', 'How a year works'],
  ['decisions', 'Decisions'],
  ['stats-and-traits', 'Stats and traits'],
  ['people-and-pets', 'People and pets'],
  ['work-and-money', 'Work, money and a home'],
  ['the-end-of-a-life', 'The end of a life'],
  ['the-next-life', 'The next life'],
  ['your-screen', 'Your screen'],
  ['pausing-and-removing', 'Pausing and removing'],
  ['help', 'Help'],
]

const t = content.tuning
const hours = (ticks: number) => ticks / 4

/** Paper Lives help (paper-lives.md "Companion"). Hidden with the game until it is live (D159). */
export const Route = createFileRoute('/help/paper-lives')({
  loader: ({ context }) => requireOpenGame(context, 'paper-lives'),
  head: () => seo({ title: 'Paper Lives help', path: '/help/paper-lives', description: 'How Paper Lives works on your TRMNL: years, decisions, stats, people, money and the next life.', index: false }),
  component: () => (
    <ProsePage title="Paper Lives on TRMNL" contents={CONTENTS}>
      <h2 id="getting-started">Getting started</h2>
      <ul>
        <li>Install Paper Lives from the TRMNL plugin marketplace and choose Install.</li>
        <li>Sign in to TRMNL Games and connect the installation. A baby is named and given a family straight away.</li>
        <li>Back in TRMNL, click Save. The first years begin within fifteen minutes.</li>
        <li>Add the plugin to a playlist or a mashup. All four layout sizes are supported in both orientations.</li>
      </ul>
      <p>While the life is a baby, until school starts at six, you can choose a girl or a boy and change the name on the Life page, even before you save the plugin in TRMNL.</p>
      <h2 id="how-a-year-works">How a year works</h2>
      <p>The first six years pass quickly, one every fifteen minutes. After that, a year lasts at least {hours(t.minYearTicks)} hours. Events happen through the year without you, such as making a friend, catching a cold, getting a raise or the dog getting out. Your screen lists them newest first, under the age they happened at, with this year at the top.</p>
      <p>Each year takes at least {hours(t.minYearTicks)} hours to play out. Once it's ready, press <strong>Age up</strong> on the Life page and your character has their birthday straight away, with a recap and the next year's decision. Press it sooner and they'll age up as soon as the year is ready. If you're away, they'll age up on their own after {hours(t.closeYearTicks)} hours. If you check in often, a life takes about a week. If you never do, it takes about a month.</p>
      <p>The seasons run through each year's first {hours(t.minYearTicks)} hours. After that, your screen shows when your character will turn a year older.</p>
      <h2 id="decisions">Decisions</h2>
      <p>Most years bring one decision, such as a job abroad, a house or a puppy. Your screen shows the question and you answer on the Life page. The choice happens when the year ends, so you can change your mind until then. Some options need a trait, enough money or a stat. These show greyed out, with the reason.</p>
      <p>If you choose nothing, the quietest option happens, such as staying put or saying nothing. A life where you never choose ends up ordinary. About one decision in five is a big one (marriage, a child, a house, a career, the will) and is marked as such.</p>
      <h2 id="stats-and-traits">Stats and traits</h2>
      <p>Health, happiness, smarts and charm run from 0 to 100. Health slips with age, and illness knocks it down for a while. Happiness follows how close you are to the people around you, your money and having a hobby. Smarts and charm open jobs and some decisions.</p>
      <p>Many events and choices move a stat or your money, and the line says so. On your screen, a stat's mark follows the line with a + or a −, doubled for a big change, and money shows as an amount. The Life page spells it out, such as “Happiness up”.</p>
      <p>Each life has two traits that never change. They decide some events and options, and each one shifts one thing:</p>
      <ul>
        {content.traits.map((trait) => (
          <li key={trait.id}><strong>{trait.name}</strong>: {trait.blurb}</li>
        ))}
      </ul>
      <h2 id="people-and-pets">People and pets</h2>
      <p>Everyone in the story has a relationship meter that moves with what happens and drifts towards the middle over the years. Partners go from going out to engaged to married. Children can arrive from 22, and grandchildren once a child is grown. A pet stays for years: a dog, a cat, a rabbit, a budgie, a tortoise or a goldfish. The People page lists everyone and remembers the dead.</p>
      <h2 id="work-and-money">Work, money and a home</h2>
      <p>At 18 the life goes to university, learns a trade or goes straight to work. That choice sets which jobs are possible, and night school at 30 opens one more tier. There are {content.jobs.length} jobs, from a paper round to a surgeon. Each year adds income and takes living costs. Money never falls below {t.debtFloor.toLocaleString('en-GB')}. A house is a big decision from 25, once there is enough saved. Retirement comes when you choose it after 60, or at 70.</p>
      <h2 id="the-end-of-a-life">The end of a life</h2>
      <p>Every life ends, mostly in old age. From 60 the will is offered: split among the children, all to one child, to a partner or to a good cause. Without one, a partner takes half and the children share the rest.</p>
      <p>A finished life becomes a page in the album with its epitaph and key moments. If it was among the longest or wealthiest of the week, it goes on the boards.</p>
      <h2 id="the-next-life">The next life</h2>
      <p>After a death, your screen shows a memorial until you start the next life on the Life page. You can carry on as one of the children, at the age they are, with the family name and what the will left them. Or you can start again as a stranger at birth.</p>
      <h2 id="your-screen">Your screen</h2>
      <p>The full layout shows the portrait with the pet, the stats, the newest lines under their ages, the year's decision or the time it closes, last year's recap and this week's longest lives. Smaller layouts keep the name, the newest lines and the decision. The code in the corner opens the companion.</p>
      <h2 id="photos">Photos</h2>
      <p>Each week your TRMNL shows a Photo code in its title bar. Enter it on the Album page to take a photo of your character as they are that week, pet and all. You can take one photo a week, and last week's code still works if your screen was slow to refresh. Photos don't affect the life. They stay with the life they were taken in, in the album and on its public page, and count towards the Photos achievements.</p>
      <h2 id="alerts">Alerts</h2>
      <p>On the More page you can turn on alerts for this phone: a big decision waiting once the year can close, a life that has ended, and a new child or grandchild in the family. They are off until you turn them on, share quiet hours with your other games, and never come more than twice a day. Ordinary decisions never send an alert.</p>
      <h2 id="pausing-and-removing">Pausing and removing</h2>
      <p>Pause a life on the More page and no years pass until you resume. Uninstalling the plugin in TRMNL keeps the life with your account. Deleting Paper Lives progress on the More page removes every life and the album, but keeps your account and your other games.</p>
      <h2 id="help">Help</h2>
      <p>Write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
    </ProsePage>
  ),
})
