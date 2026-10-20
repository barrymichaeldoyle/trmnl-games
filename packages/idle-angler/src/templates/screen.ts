/**
 * Idle Angler screen markup (idle-angler.md "Device"). TRMNL framework 3.4 Liquid over the flat payload. TRMNL wraps
 * each layout in its own `.view`, so markup starts at the layout and closes with the title bar (the framework sizes a
 * layout only when the title bar is its next sibling). Each layout has a landscape and a portrait arrangement; images
 * are whole-number scales of 1-bit art (`qr_base` plus `/<scale>.png`; `scene_base` plus `/<width>/<scale>.png`),
 * chosen per size and screen so every pixel stays crisp: `lg:` swaps in the TRMNL X's larger scales. User text
 * arrives only as escaped variables.
 *
 * Template v2 (2026-10-10) brings the screen up to Desk Crawler's HUD: marks instead of words for the counters
 * (cooler, bait, gold, logbook), progress to the next title as ten half-step ticks, the time of day and weather as marks,
 * a glyph before every story, the attention line inverted behind its mark, the water's weekly board of heaviest fish,
 * and the recap as facts behind their marks.
 * The OG's full landscape shows five stories where three left the foot empty; the X's sets its stories beside the board.
 * Template v4 (D125) asks for the stage width that fills each scene slot at its whole-number scale (scene v3), so
 * the water reaches the slot's edges instead of floating in it, and lifts the OG's landscape half to 3x.
 * Template v5 (2026-10-13) lets the title ticks shrink to their column, so in the X's landscape half the count wraps
 * under the ticks instead of running under the QR code.
 * Template v6 (D162) pins the current goal under content v2 on the X's full landscape, behind the star, as Desk
 * Crawler's does (D138): it heads the stories' column, which gives up a story for it, so the board keeps its rows.
 * Template v7 (2026-10-14) lets every layout show as many stories as fit, up to sixteen, rather than a fixed count
 * chosen for the smallest screen: the framework's overflow engine on the OG, counts measured per layout on the X.
 * Template v8 (2026-10-14) fits the X's stories to their list in place of those counts, so a device scale
 * (`screen--scale-xlarge`) no longer cuts the last stories in half.
 * Template v9 (2026-10-14): where a large device scale leaves no room for a single story, the lesser counters give way
 * (`data-give-way`) so the newest story still shows.
 * Template v12 (issue #8, D196): a goal reward waiting for the companion's Claim button leads the attention line behind
 * the star when nothing more pressing does, and the X's goal row inverts to the waiting coins until they are claimed.
 * Template v14 (D200): the screen speaks the owner's language. Its own words come from the payload's `labels`, read
 * with the English as the default, and the time of day and weather from `band_label` and `weather_label`. The
 * landscape half-horizontal info column gives way like the X's lists when a longer language overfills it.
 * Template v16 (D204): under content v6 the header's title is the rank at the angler's water and its ticks count that
 * water's species (`title_logged`); the logbook counter still counts them all.
 * Template v15 (2026-10-20): a time on every story, the goal set apart under its own pennant and shown on the OG
 * too, the welcome headed by the scene, the attention line above the stories rather than in their place, wrapped
 * counter rows closer together, the X's header code at 3x, and full board names where the OG has the width.
 * Template v13 (D199): a dot between the angler's name and title, which ran together as one name ("Wren Master Angler"),
 * and the newest catch's name without a clamp: the clamp measured its column before the layout settled and cut
 * "Barbel" to "Bar..." with the column empty beside it. Species names are at most thirteen characters.
 */
import { markUri, STORY_GLYPHS, type IaMark } from '../art/marks'
import { en } from '../i18n/en'
import type { DeviceLabel } from '../i18n/types'

export const TEMPLATE_VERSION = 16

/** D200: one of the template's own words in the owner's language, read from the payload's `labels` with the English as the default. */
const L = (key: DeviceLabel) => `{{ labels.${key} | default: "${en.device.labels[key]}" }}`

const svgDataUri = (svg: string) => `data:image/svg+xml;base64,${btoa(svg)}`

/** Title-bar icon: a float on a ripple. Inline, so it never needs the network. */
const TITLE_ICON = svgDataUri(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="square">' +
    '<path d="M12 3v4"/><circle cx="12" cy="11" r="4"/><path d="M12 9v4" stroke="black"/><path d="M3 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/></svg>',
)

/** Every mark a layout uses, assigned once at its top so the markup repeats a variable rather than the SVG. */
const MARKS: readonly IaMark[] = ['cooler', 'hook', 'coin', 'book', 'pin', 'trophy', 'star', 'goal', 'day', 'dawn', 'dusk', 'night', 'clear', 'overcast', 'rain', 'wind', 'fog', 'tickEmpty', 'tickHalf', 'tickFull', ...STORY_GLYPHS]
const ASSIGNS = MARKS.map((mark) => `{% assign m_${mark} = "${mark.startsWith('tick') ? markUri(mark, 36, 16) : markUri(mark, 32)}" %}`).join('')

/** 16px on the OG; 20px on the X, where the text beside it is larger. */
/** D181: the framework repaints `image--adaptive` marks in the theme's ink, so they stay visible under TRMNL's Dark theme. */
const ADAPTIVE = 'image--adaptive'
const ICON = `w--[16px] h--[16px] lg:w--[20px] lg:h--[20px] no-shrink ${ADAPTIVE}`
const LABEL = 'label lg:title--small'

/**
 * One count behind its mark; the mark sits three pixels from its text. Counts are short and their row wraps, so none
 * clamps. Template v15: the 12px right padding plus the row's 4px gap keep counts 16px apart across a line, while a
 * wrapped line sits only 4px below the one above (the framework's gaps apply both ways).
 */
const counter = (mark: string, text: string, data = '') => `<div class="flex flex--row flex--center-y gap--[3px] no-shrink pr--3"${data}><img class="${ICON}" src="{{ ${mark} }}" alt=""><span class="${LABEL}">${text}</span></div>`

/** A wrapping row of counters, each 16px from the next so each number reads as its own mark's. */
const row = (inner: string, data: string) => `<div class="flex flex--row flex--wrap flex--left flex--center-y gap--[4px] stretch-x" ${data}>${inner}</div>`

/** The time of day and the weather, each behind its mark ("Dusk", "Overcast"). */
const conditionMarks =
  `{% if band %}{% case band %}{% when "dawn" %}{% assign m_band = m_dawn %}{% when "dusk" %}{% assign m_band = m_dusk %}{% when "night" %}{% assign m_band = m_night %}{% else %}{% assign m_band = m_day %}{% endcase %}` +
  `{% case weather %}{% when "overcast" %}{% assign m_weather = m_overcast %}{% when "rain" %}{% assign m_weather = m_rain %}{% when "wind" %}{% assign m_weather = m_wind %}{% when "fog" %}{% assign m_weather = m_fog %}{% else %}{% assign m_weather = m_clear %}{% endcase %}` +
  `${counter('m_band', '{% if band_label %}{{ band_label | escape }}{% else %}{{ band | capitalize }}{% endif %}', ' data-band="{{ band }}" data-give-way="2"')}${counter('m_weather', '{% if weather_label %}{{ weather_label | escape }}{% else %}{{ weather | capitalize }}{% endif %}', ' data-weather="{{ weather }}" data-give-way="1"')}{% endif %}`

/** Where the angler is: the one counter that can be long ("Heading to the Harbour Pier"), so it may wrap to two lines. */
const place = `<div class="flex flex--row flex--top gap--[3px] w--min-0 pr--3" data-place="true"><img class="${ICON}" src="{{ m_pin }}" alt=""><span class="${LABEL} w--min-0" data-clamp="2">{{ status_label | escape }}</span></div>`

/** Where the angler is, then the conditions. */
const statusRow = (withConditions = true) => row(`${place}${withConditions ? conditionMarks : ''}`, 'data-status-row="true"')

/**
 * Cooler, bait, gold and logbook. `short` drops the logbook for the half-height column; `compact` also drops the bait
 * for the narrowest columns.
 */
const counters = (fit: 'all' | 'short' | 'compact' = 'all') =>
  `{% if cooler_label %}${row(
    counter('m_cooler', '{{ cooler_label }}', ' data-cooler="{{ cooler_label }}" data-give-way="5"') +
      (fit === 'compact' ? '' : counter('m_hook', '{% if bait_count %}{{ bait_name | escape }} {{ bait_count }}{% else %}{{ bait_name | default: "Bare hook" | escape }}{% endif %}', ' data-bait="true" data-give-way="4"')) +
      counter('m_coin', '{{ gold }}', ' data-give-way="6"') +
      (fit === 'all' ? counter('m_book', '{{ species_logged }}/{{ species_total }}', ' data-logbook="true" data-give-way="3"') : ''),
    'data-counters="true"',
  )}{% endif %}`

/**
 * Progress to the next title as ten half-step ticks with the species count after them (titles.ts); v16 (D204) counts
 * `title_logged`, the species at the angler's water when the header shows its rank there. Desk Crawler's bar
 * and rounding, so both Liquids agree; at the last title there is nothing left to fill and the bar is left off.
 */
const xpTicks = (count = true) =>
  `{% if title_next_at %}{% assign xp_halves = title_pct | default: 0 | times: 20 | plus: 50 | divided_by: 100 | floor %}<div class="flex flex--row flex--wrap flex--left flex--center-y gap--small" data-xp-ticks="{{ xp_halves }}"><div class="flex flex--row gap--[2px] no-shrink">{% for i in (1..10) %}{% assign tick_right = i | times: 2 %}{% assign tick_left = tick_right | minus: 1 %}<img class="w--[18px] h--[8px] lg:w--[22px] lg:h--[10px] no-shrink ${ADAPTIVE}" src="{% if xp_halves >= tick_right %}{{ m_tickFull }}{% elsif xp_halves >= tick_left %}{{ m_tickHalf }}{% else %}{{ m_tickEmpty }}{% endif %}" alt="">{% endfor %}</div>${count ? `<span class="${LABEL} no-shrink">{{ title_logged | default: species_logged }}/{{ title_next_at }}</span>` : ''}</div>{% endif %}`

/**
 * The title bar with the weekly fly code. A narrow portrait column (side, quarter) cannot fit the name beside the
 * code, so while a code shows it takes the name's place there with the short label, as Desk Crawler's keepsake does.
 */
const titleBar = (orientation: 'landscape' | 'portrait', narrow = false) => `
<div class="title_bar ${orientation === 'landscape' ? 'portrait:hidden' : 'landscape:hidden'}">
  <img class="image image-stroke ${ADAPTIVE}" src="${TITLE_ICON}" alt="">
  <span class="title${narrow ? '{% if fly_code %} hidden lg:inline-block{% endif %}' : ''}">Idle Angler</span>
  {% if fly_code %}<span class="instance">${narrow ? L('fly') : L('fly_code')} {{ fly_code | escape }}</span>{% endif %}
</div>`

/** One layout in both orientations, each followed by its own title bar; the marks are assigned once ahead of both. */
const oriented = (classes: string, landscape: string, portrait: string, narrowPortrait = false) => `${ASSIGNS}${FLY_ASSIGNS}${fitStories}
<div class="${classes} portrait:hidden">${landscape}
</div>${titleBar('landscape')}
<div class="${classes} landscape:hidden">${portrait}
</div>${titleBar('portrait', narrowPortrait)}`

/**
 * The scene for one slot: the OG's stage width and scale, then the X's. Each width is the slot's width over the scale
 * (over 1.8 times the scale on the X, which draws images that much larger), so the image fills the slot edge to edge:
 * the OG's full view is 780 wide inside its padding, its side view 365, its portrait half 440 and its portrait side
 * 205; the X's full view is 1836 and its side 873 (`tools/trmnl` measures these in the framework previews).
 */
const scene = (og: readonly [width: number, scale: number], x: readonly [width: number, scale: number], classes = 'stretch-x') =>
  `{% if scene_base != "" %}<div class="${classes} no-shrink flex flex--row flex--center-x"><img class="image lg:hidden" src="{{ scene_base }}/${og[0]}/${og[1]}.png" alt=""><img class="image hidden lg:block" src="{{ scene_base }}/${x[0]}/${x[1]}.png" alt=""></div>{% endif %}`

/**
 * D180: while this week's fly waits and the code is not sending a full cooler to the companion, the standing code opens
 * the fly's claim link instead and is captioned with the code, so a hidden title bar still leaves a way to it.
 */
const FLY_ASSIGNS = `{% assign fly_waiting = false %}{% if fly_code and fly_qr_base and fly_qr_base != "" and qr_base != "" and qr != "cooler" %}{% assign fly_waiting = true %}{% assign qr_base = fly_qr_base %}{% endif %}`

const qr = (og: number, x: number) =>
  `{% if qr_base != "" %}<div class="no-shrink flex flex--col flex--center-x gap--xsmall" data-companion-qr="true"><img class="image lg:hidden" src="{{ qr_base }}/${og}.png" alt=""><img class="image hidden lg:block" src="{{ qr_base }}/${x}.png" alt="">{% if fly_waiting %}<span class="${LABEL} text--center text--bold" data-fly-caption="true">${L('fly')}&nbsp;{{ fly_code | escape | replace: " ", "&nbsp;" }}</span>{% endif %}</div>{% endif %}`

/** The angler's name, then the title beside it behind a dot (v13), so "Wren · Old Hand" does not read as one name. */
const nameLine = (classes = 'title title--small') =>
  `<span class="${classes} w--min-0" data-clamp="1">{{ alias | escape }}</span>{% if title %}<span class="${LABEL} no-shrink">&middot;&nbsp;{{ title | escape }}</span>{% endif %}`

/** The cooler, bait or service line, inverted behind its mark so it reads first. */
const attention = (clamp = 2) =>
  `{% if attention %}{% case attention_kind %}{% when "cooler" %}{% assign m_attention = m_cooler %}{% when "bait" %}{% assign m_attention = m_bait_out %}{% when "goal" %}{% assign m_attention = m_goal %}{% else %}{% assign m_attention = m_system %}{% endcase %}` +
  `<div class="flex flex--row flex--left flex--center-y gap--small no-shrink stretch-x" data-attention="{{ attention_kind }}"><img class="${ICON}" src="{{ m_attention }}" alt=""><span class="${LABEL} label--inverted" data-clamp="${clamp}">{{ attention | escape }}</span></div>{% endif %}`

/** One story's glyph: its kind's, a star for a milestone, the pennant for a goal (D162, template v15), the trophy for an Open, a fish for a run, a dot for anything else. */
const storyGlyph = `{% case story.kind %}${STORY_GLYPHS.filter((kind) => kind !== 'system')
  .map((kind) => `{% when "${kind}" %}{% assign m_story = m_${kind} %}`)
  .join('')}{% when "milestone" %}{% assign m_story = m_star %}{% when "goal" %}{% assign m_story = m_goal %}{% when "open" %}{% assign m_story = m_achievement %}{% when "run" %}{% assign m_story = m_catch %}{% else %}{% assign m_story = m_system %}{% endcase %}`

/**
 * D162: the current goal; under content v1 there is none and nothing renders. While goal rewards wait (issue #8) the
 * row inverts to them instead, unless the attention line above already says so. Template v15 sets the goal apart from
 * the log below it: its own pennant (milestones keep the star), "Goal:" in bold, and a rule under it. The OG shows it
 * too now, where it was the X's alone.
 */
const goal = () =>
  `{% if goal_claim %}{% unless attention_kind == "goal" %}<div class="flex flex--row flex--left flex--center-y gap--small no-shrink stretch-x" data-goal-claim="true"><img class="${ICON}" src="{{ m_goal }}" alt=""><span class="${LABEL} label--inverted w--min-0" data-clamp="1">{% if goal_claim.label %}{{ goal_claim.label | escape }}{% else %}{% if goal_claim.count > 1 %}{{ goal_claim.count }} goals{% else %}Goal{% endif %} reached! Claim {{ goal_claim.coins }} coins in the companion.{% endif %}</span></div>{% endunless %}` +
  `{% elsif goal_line %}<div class="no-shrink stretch-x flex flex--col gap--xsmall" data-goal="true"><div class="flex flex--row flex--left flex--center-y gap--small stretch-x"><img class="${ICON}" src="{{ m_goal }}" alt=""><div class="flex flex--row flex--left flex--center-y gap--[4px] grow w--min-0"><span class="${LABEL} text--bold no-shrink">${L('goal')}</span><span class="${LABEL} grow w--min-0" data-clamp="1">{{ goal_line | escape }}</span></div></div><div class="border--h-30 stretch-x"></div></div>{% endif %}`

/**
 * The newest stories, each behind its glyph. Template v7: `limit` is the most a layout may show; the stories are a
 * `data-overflow` list inside a `.columns > .column` pair, so the framework's overflow engine measures them in place
 * against the space down to the end of the `.columns` box and hides the trailing ones that do not fit, so a tall slot such as the X's full view fills with stories instead of stopping at a fixed count (Barry,
 * 2026-10-14). The list and the full layouts' wrappers are `flex-auto`, so before the engine trims they shrink to
 * exactly the space left (siblings that are `stretch-x` keep their content height), and the column is top-aligned.
 * On the X the engine misjudged heights (the X scales its content), so the X's list is one line a story and, since
 * template v8, `fitStories` hides the trailing stories that end below the list, at whatever scale the device sets; the
 * OG's keeps the engine and two or three lines where the layout asks for them.
 */
/**
 * Template v15: the clock time of each story at its right, in the owner's time (`utc_offset`, as Desk Crawler's log),
 * so the order of a busy hour reads at a glance. Without an offset the times are left off rather than shown in UTC.
 */
const storyTime = (classes: string) => `{% if utc_offset != nil and story.u %}<span class="${classes} no-shrink" data-story-time="true">{{ story.u | plus: utc_offset | date: "%H:%M" }}</span>{% endif %}`

const storyList = (limit: number, clamp: number, classes: string, show: string, engine = true) =>
  `<div class="columns ${show} flex-auto h--min-0 w--full" data-stories="true"${engine ? '' : ' data-fit-stories="true"'}><div class="column flex--col flex--top"><div class="flex flex--col flex--left gap--[3px] w--full"${engine ? ' data-overflow="true"' : ''}>{% for story in stories limit:${limit} %}${storyGlyph}<div class="item flex flex--row flex--top gap--small stretch-x" data-story="{{ story.kind }}"><img class="${ICON}" src="{{ m_story }}" alt=""><span class="${classes} grow w--min-0" data-clamp="${clamp}">{{ story.summary | escape }}</span>${storyTime(classes)}</div>{% endfor %}</div></div></div>`
/** The OG's list keeps the layout's clamp; the X's is one line a story, the only clamp its engine pass keeps exactly. */
const stories = (limit: number, clamp = 1, classes = 'description lg:title--small') => storyList(limit, clamp, classes, 'lg:hidden') + storyList(limit, 1, classes, 'hidden lg:flex', false)

/**
 * The X's story lists (`data-fit-stories`, template v8): once the framework has laid out the view, hide the trailing
 * stories that end below their list, so the list keeps whole stories at any device scale (`screen--scale-*`,
 * `screen--text-scale-*`). Only visibility changes, as Desk Crawler's `fitStories`; scoped to this view and to the
 * orientation the framework is showing. Template v9: where not one story fits (a large device scale), the counters marked
 * `data-give-way` step aside, the lowest number first (weather, time of day, logbook, bait, cooler, gold), until one does.
 */
const fitStories = `<script>
(() => {
  const view = document.currentScript.closest('.view');
  if (!view) return;
  const fit = () => { fitColumns(); fitLists(); };
  // Template v14: a column marked data-fit-column that overflows its height (a longer language on the narrowest
  // layouts) hides its give-way counters, the lowest number first, until it fits.
  const fitColumns = () => view.querySelectorAll('[data-fit-column]').forEach((column) => {
    if (!column.getClientRects().length) return;
    const extras = Array.from(column.querySelectorAll('[data-give-way]')).sort((a, b) => a.dataset.giveWay - b.dataset.giveWay);
    extras.forEach((extra) => extra.classList.remove('hidden'));
    const room = column.closest('.layout').getBoundingClientRect().height;
    const span = () => {
      const shown = Array.from(column.children).filter((child) => child.getClientRects().length && child.getBoundingClientRect().height > 0);
      return shown.length ? shown[shown.length - 1].getBoundingClientRect().bottom - shown[0].getBoundingClientRect().top : 0;
    };
    for (const extra of extras) {
      if (span() <= room + 0.5) break;
      extra.classList.add('hidden');
    }
  });
  const fitLists = () => view.querySelectorAll('[data-fit-stories]').forEach((list) => {
    if (!list.getClientRects().length) return;
    const items = Array.from(list.querySelectorAll('.item'));
    // Template v15: an attention line already says what matters most, so no counter steps aside for a story under it.
    const layout = list.closest('.layout');
    const extras = layout.querySelector('[data-attention]') ? [] : Array.from(layout.querySelectorAll('[data-give-way]')).sort((a, b) => a.dataset.giveWay - b.dataset.giveWay);
    extras.forEach((extra) => extra.classList.remove('hidden'));
    const place = () => {
      items.forEach((item) => item.classList.remove('hidden'));
      const bottom = list.getBoundingClientRect().bottom;
      let count = items.length;
      while (count && items[count - 1].getBoundingClientRect().bottom > bottom + 0.5) items[--count].classList.add('hidden');
      return count;
    };
    let count = place();
    for (const extra of extras) {
      if (count || !items.length) break;
      extra.classList.add('hidden');
      count = place();
    }
    list.dataset.storyCount = String(count);
  });
  window.addEventListener('trmnl:terminalize:stats', fit);
  window.addEventListener('load', () => { if (window.TRMNL_PLUGINS_READY) fit(); }, { once: true });
  if (window.TRMNL_PLUGINS_READY) fit();
})();
</script>`

/**
 * This week's heaviest fish at the angler's water: the trophy and water, the angler's rank and best, then each row's
 * name and weight. Each row is itself the label, so an inverted own row keeps its text white (a `.label` child would
 * set its own colour), as Desk Crawler's board does. The OG shows the short names, except where the board spans the
 * whole view (`wide`, template v15) and a full name fits.
 */
const board = (rows: number, wide = false) =>
  `{% if board %}<div class="no-shrink flex flex--col gap--xsmall w--full" data-board="true">` +
  `<div class="flex flex--row flex--center-y gap--[3px] w--full"><img class="${ICON}" src="{{ m_trophy }}" alt=""><span class="${LABEL} grow w--min-0" data-clamp="1">{{ board.label | escape }}</span></div>` +
  `<span class="${LABEL} w--full" data-clamp="1">{{ board.rank_label | escape }}</span>` +
  `{% for row in board.rows limit:${rows} %}<div class="${LABEL} flex flex--row flex--between flex--center-y gap--small w--full{% if row.own %} label--inverted{% endif %}" data-rank-row="{{ row.rank }}"><span class="grow w--min-0" data-clamp="1">{{ row.rank }}. ${wide ? '{{ row.name | escape }}' : '<span class="lg:hidden">{{ row.name_short | default: row.name | escape }}</span><span class="hidden lg:inline">{{ row.name | escape }}</span>'}</span><span class="no-shrink">{{ row.weight_label }}</span></div>{% endfor %}</div>{% endif %}`

/**
 * The twelve-hour recap as Desk Crawler's ribbon: a rule, then its name in bold and each fact behind its mark. Each
 * piece is unbreakable, so a narrow column wraps between facts rather than inside one. A spacer ahead of it holds it
 * at the foot of the layout.
 */
const recap = () =>
  `{% if recap_items %}<div class="no-shrink stretch-x" data-recap="true"><div class="border--h-30 stretch-x"></div>` +
  `<div class="pt--2 flex flex--row flex--wrap flex--left flex--center-y gap--small stretch-x"><span class="${LABEL} text--bold no-shrink">${L('last_12_hours')}</span>` +
  `{% for item in recap_items %}{% case item.k %}{% when "best" %}{% assign m_recap = m_trophy %}{% when "got_away" %}{% assign m_recap = m_got_away %}{% else %}{% assign m_recap = m_catch %}{% endcase %}` +
  `<div class="flex flex--row flex--center-y gap--[3px] no-shrink" data-recap-item="{{ item.k }}"><img class="${ICON}" src="{{ m_recap }}" alt=""><span class="${LABEL}">{{ item.text | escape }}</span></div>{% endfor %}</div></div>{% endif %}`

/**
 * The newest fish among the stories shown: its sprite beside its name and weight, "Released" when the cooler was full.
 * Only the layouts with room for it show it (the X, and the full portrait).
 */
const catchPanel = (og: number, x: number) =>
  `{% if newest_catch %}<div class="flex flex--row flex--left flex--center-y gap--medium stretch-x no-shrink" data-catch="true">` +
  `{% if newest_catch.fish_base != "" %}<div class="no-shrink"><img class="image lg:hidden" src="{{ newest_catch.fish_base }}/${og}.png" alt=""><img class="image hidden lg:block" src="{{ newest_catch.fish_base }}/${x}.png" alt=""></div>{% endif %}` +
  `<div class="flex flex--col flex--left gap--xsmall grow w--min-0"><span class="${LABEL}">{% if newest_catch.released %}${L('released')}{% else %}${L('newest_catch')}{% endif %}</span>` +
  `<span class="title title--small">{{ newest_catch.name | escape }}</span>{% if newest_catch.weight_label %}<span class="${LABEL}">{{ newest_catch.weight_label }}</span>{% endif %}</div></div>{% endif %}`

/**
 * Before activation: what to do next and the code to the companion. Template v15: where there is room the scene of the
 * first water heads it (the payload sends one before activation), so the first screen a new player or a reviewer sees
 * already shows the game; the code and the words sit beside each other (`row`) or stacked (`col`) below it.
 */
const welcome = ({ art = '', arrange, qrOg, qrX, small = false }: { art?: string; arrange: 'row' | 'col'; qrOg: number; qrX: number; small?: boolean }) => `
  <div class="flex flex--col flex--center-x flex--center-y gap--medium stretch-x grow" data-welcome="true">${art}
    <div class="flex flex--${arrange} flex--center-x flex--center-y gap--medium stretch-x">
      ${qr(qrOg, qrX)}
      <div class="flex flex--col flex--center-x gap--xsmall w--min-0">
        <span class="${small ? 'title title--small' : 'title'} lg:title--large text--center">{% if status == "pending" %}{% assign ready_name = alias | escape %}{{ labels.ready | default: "${en.device.labels.ready}" | replace: "%name%", ready_name }}{% elsif data_state == "service_paused" %}${L('back_soon')}{% else %}${L('finish_setup')}{% endif %}</span>
        <span class="label lg:title--small text--center" data-clamp="3">{% if status == "pending" %}${L('save_plugin')}{% else %}{{ attention | escape }}{% endif %}</span>
        <span class="label lg:title--small">trmnlgames.com</span>
      </div>
    </div>
  </div>`

const ready = (body: string, before: string) => `{% if status == "unlinked" or status == "pending" %}${before}{% else %}${body}{% endif %}`

/** The full header: name, title and progress; where and when; the counters; the code in the corner. */
const header = (qrOg: number, qrX: number) => `
    <div class="no-shrink flex flex--row flex--between flex--top gap--small stretch-x">
      <div class="flex flex--col flex--left gap--xsmall grow w--min-0">
        <div class="flex flex--row flex--wrap flex--left flex--center-y gap--small stretch-x" data-name-row="true">${nameLine()}${xpTicks()}</div>
        ${statusRow()}
        ${counters()}
      </div>
      ${qr(qrOg, qrX)}
    </div>`

/**
 * Template v15: the X's header code is drawn at 3x rather than 4x (still larger on the glass than the OG's 2x), so it
 * no longer stands far taller than the three lines beside it and leaves a band of white above the scene.
 */
const full = oriented(
  'layout layout--col layout--top layout--stretch-x gap--small lg:gap--large',
  ready(`${header(2, 3)}
    <div class="lg:hidden no-shrink stretch-x">{% if board %}<div class="flex flex--row flex--top gap--medium stretch-x">${scene([152, 4], [152, 4], '')}<div class="grow w--min-0">${board(5)}</div></div>{% else %}${scene([156, 5], [156, 5])}{% endif %}</div>
    <div class="lg:hidden flex flex--col flex--left flex--top gap--small flex-auto h--min-0 w--full">${attention(1)}${goal()}${stories(16)}</div>
    <div class="hidden lg:flex flex--col flex--left flex--top gap--medium flex-auto h--min-0 w--full">${scene([170, 6], [170, 6])}${attention(1)}
      <div class="flex flex--row flex--stretch gap--large flex-auto h--min-0 w--full"><div class="grow w--min-0 flex flex--col flex--left gap--small">${goal()}${stories(16, 2)}</div><div class="no-shrink flex flex--col flex--left gap--medium">${board(6)}{% assign board_rows = board.rows | size %}{% if attention == nil and board_rows < 6 %}${catchPanel(4, 5)}{% endif %}</div></div>
    </div>
    ${recap()}`, welcome({ art: scene([156, 5], [170, 6]), arrange: 'row', qrOg: 3, qrX: 4 })),
  ready(`${header(2, 3)}
    ${scene([153, 3], [152, 5])}
    ${attention(3)}
    ${goal()}
    ${stories(16, 2, 'label')}
    ${catchPanel(3, 8)}
    ${board(6, true)}
    ${recap()}`, welcome({ art: scene([153, 3], [152, 5]), arrange: 'col', qrOg: 3, qrX: 5 })),
)

/**
 * Template v15: the attention line no longer replaces the stories in the half and quarter layouts; the stories fill
 * whatever room is left below it. The X's landscape scene here is 3x on a wider stage, which gives the column beside
 * it a third more width, so its stories read as sentences rather than a few words each.
 */
const halfHorizontal = oriented(
  'layout layout--row layout--left layout--stretch-y gap--medium',
  ready(`
    <div class="no-shrink flex flex--col flex--center-y gap--small">${scene([120, 3], [168, 3])}</div>
    <div class="flex flex--col flex--left gap--xsmall grow w--min-0 h--full" data-fit-column="true">
      <div class="flex flex--row flex--wrap flex--left flex--center-y gap--small stretch-x">${nameLine()}${xpTicks()}</div>
      ${statusRow()}
      ${counters('short')}
      ${attention(1)}
      ${stories(16, 1)}
    </div>
    ${qr(2, 4)}`, welcome({ arrange: 'row', qrOg: 3, qrX: 4, small: true })),
  ready(`
    <div class="flex flex--col flex--left gap--small grow w--min-0 h--full">
      <div class="flex flex--row flex--center-y gap--small stretch-x"><div class="flex flex--row flex--left flex--center-y gap--small grow w--min-0">${nameLine()}</div>${qr(2, 4)}</div>
      ${scene([220, 2], [185, 4])}
      ${statusRow()}
      ${counters()}
      ${attention()}
      ${stories(16, 2)}
    </div>`, welcome({ art: scene([220, 2], [185, 4]), arrange: 'row', qrOg: 2, qrX: 4, small: true })),
)

const halfVertical = oriented(
  'layout layout--col layout--top layout--stretch-x gap--small',
  ready(`
    <div class="no-shrink flex flex--row flex--center-y gap--small stretch-x"><div class="flex flex--col flex--left gap--xsmall grow w--min-0"><div class="flex flex--row flex--left flex--center-y gap--small stretch-x">${nameLine()}</div>${xpTicks()}</div>${qr(2, 3)}</div>
    ${scene([182, 2], [161, 3])}
    ${statusRow()}
    ${counters()}
    ${attention()}
    ${goal()}
    ${stories(16, 2)}
    ${recap()}`, welcome({ art: scene([182, 2], [161, 3]), arrange: 'col', qrOg: 3, qrX: 5 })),
  ready(`
    <div class="no-shrink flex flex--row flex--left flex--center-y gap--small stretch-x">${nameLine('title title--small')}</div>
    ${scene([205, 1], [177, 2])}
    ${xpTicks()}
    ${statusRow()}
    ${counters('short')}
    ${attention(3)}
    ${stories(16, 3, 'description')}
    ${board(5)}
    <div class="no-shrink flex flex--row flex--center-x stretch-x">${qr(2, 4)}</div>`, welcome({ art: scene([205, 1], [177, 2]), arrange: 'col', qrOg: 3, qrX: 5 })),
  true,
)

const quadrant = oriented(
  'layout layout--col layout--top layout--stretch-x gap--small',
  ready(`
    <div class="no-shrink flex flex--row flex--top gap--small stretch-x">
      <div class="flex flex--col flex--left gap--xsmall grow w--min-0">
        <div class="flex flex--row flex--left flex--center-y gap--small stretch-x">${nameLine('title title--small')}</div>
        ${statusRow(false)}
        ${counters('compact')}
      </div>
      ${qr(2, 3)}
    </div>
    ${attention(2)}
    ${stories(16, 2)}`, welcome({ arrange: 'row', qrOg: 2, qrX: 3, small: true })),
  ready(`
    <div class="no-shrink flex flex--row flex--left flex--center-y gap--small stretch-x">${nameLine('title title--small')}</div>
    ${statusRow(false)}
    ${counters('compact')}
    ${attention(3)}
    ${stories(16, 3, 'description')}
    <div class="no-shrink flex flex--row flex--center-x stretch-x">${qr(2, 4)}</div>`, welcome({ arrange: 'col', qrOg: 2, qrX: 3, small: true })),
  true,
)

export const screenMarkup = {
  markup: full,
  markup_half_horizontal: halfHorizontal,
  markup_half_vertical: halfVertical,
  markup_quadrant: quadrant,
} as const
