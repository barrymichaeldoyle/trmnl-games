/**
 * Little Plot screen markup (little-plot.md "Device"). TRMNL framework 3.4 Liquid over the flat payload
 * (lib/payload.ts). TRMNL wraps each layout in its own `.view`, so markup starts at the layout and closes with the
 * title bar. Each layout has a landscape and a portrait arrangement; images are whole-number scales of 1-bit art
 * (`qr_base` plus `/<scale>.png`; `scene_base` plus `/<width>/<scale>.png`), chosen per size and screen so every pixel
 * stays crisp: `lg:` swaps in the TRMNL X's larger scales. User text arrives only as escaped variables.
 *
 * Template v1 (D206, G3): the plot scene for the slot's width, the alias and level, the season and conditions behind
 * marks, the ripe, coin and seed counters, the attention line inverted behind its mark (half the beds ripe, a waiting
 * goal reward, a service note), the goal under its pennant, the newest stories each behind its glyph with their
 * times, the seven-day Top 5 with the plot's own row, the twelve-hour recap behind marks, and the companion code.
 * The stories are fitted by measurement (`fitStories`, as Idle Angler's template v17), so a device scale never cuts a
 * story in half, and the lesser counters step aside where a large scale leaves no room for one.
 */
import { markUri, STORY_GLYPHS, type LpMark } from '../art/marks'

export const TEMPLATE_VERSION = 1

const svgDataUri = (svg: string) => `data:image/svg+xml;base64,${btoa(svg)}`

/** Title-bar icon: a seedling in a pot. Inline, so it never needs the network. */
const TITLE_ICON = svgDataUri(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="square">' +
    '<path d="M12 13v8"/><path d="M12 13c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M12 13c0-4-3-6-7-6 0 4 3 6 7 6z"/><path d="M6 21h12"/></svg>',
)

const MARKS: readonly LpMark[] = ['coin', 'star', 'ripe', 'seed', 'water', 'goal', 'trophy', 'pest', 'gnome', 'cross', 'shed', 'day', 'dawn', 'dusk', 'night', 'clear', 'overcast', 'rain', 'fog', 'frost', 'leaf', 'stage', 'seeded', 'ambient', 'visit', 'harvest', 'achievement', 'system']
const ASSIGNS = [...new Set(MARKS)].map((mark) => `{% assign m_${mark} = "${markUri(mark, 32)}" %}`).join('')

/** D181: the framework repaints `image--adaptive` marks in the theme's ink, so they stay visible under TRMNL's Dark theme. */
const ADAPTIVE = 'image--adaptive'
const ICON = `w--[16px] h--[16px] lg:w--[20px] lg:h--[20px] no-shrink ${ADAPTIVE}`
const LABEL = 'label lg:title--small'

/** One count behind its mark; the mark sits three pixels from its text. */
const counter = (mark: string, text: string, data = '') => `<div class="flex flex--row flex--center-y gap--[3px] no-shrink pr--3"${data}><img class="${ICON}" src="{{ ${mark} }}" alt=""><span class="${LABEL}">${text}</span></div>`
const row = (inner: string, data: string) => `<div class="flex flex--row flex--wrap flex--left flex--center-y gap--[4px] stretch-x" ${data}>${inner}</div>`

/** The season, the time of day and the weather, each behind its mark; the frost flake when a winter night is clear. */
const conditionMarks =
  `{% case band %}{% when "dawn" %}{% assign m_band = m_dawn %}{% when "dusk" %}{% assign m_band = m_dusk %}{% when "night" %}{% assign m_band = m_night %}{% else %}{% assign m_band = m_day %}{% endcase %}` +
  `{% case weather %}{% when "overcast" %}{% assign m_weather = m_overcast %}{% when "rain" %}{% assign m_weather = m_rain %}{% when "fog" %}{% assign m_weather = m_fog %}{% else %}{% assign m_weather = m_clear %}{% endcase %}` +
  `{% case season %}{% when "summer" %}{% assign m_season = m_day %}{% when "winter" %}{% assign m_season = m_frost %}{% else %}{% assign m_season = m_leaf %}{% endcase %}` +
  `${counter('m_season', '{{ season_label | escape }}', ' data-season="{{ season }}" data-give-way="3"')}${counter('m_band', '{{ band | capitalize }}', ' data-band="{{ band }}" data-give-way="2"')}${counter('m_weather', '{% if frost %}Frost{% else %}{{ weather | capitalize }}{% endif %}', ' data-weather="{{ weather }}" data-give-way="1"')}`

const statusRow = () => row(conditionMarks, 'data-status-row="true"')

/** Ripe beds, coins, seeds and the water left. `short` drops the water; `compact` also drops the seeds. */
const counters = (fit: 'all' | 'short' | 'compact' = 'all') =>
  `{% if ripe_label %}${row(
    counter('m_ripe', '{{ ripe_label }}', ' data-ripe="{{ ripe_count }}" data-give-way="6"') +
      counter('m_coin', '{{ gold }}', ' data-give-way="5"') +
      (fit === 'compact' ? '' : counter('m_seed', '{{ seed_count }}', ' data-seeds="true" data-give-way="4"')) +
      (fit === 'all' ? counter('m_water', '{% if watered %}{{ water_hours }} h{% else %}Dry{% endif %}', ' data-water="true" data-give-way="3"') : ''),
    'data-counters="true"',
  )}{% endif %}`

/** The title bar with the weekly flower code. A narrow column takes the short label in the name's place while a code shows. */
const titleBar = (orientation: 'landscape' | 'portrait', narrow = false, short = narrow) => `
<div class="title_bar ${orientation === 'landscape' ? 'portrait:hidden' : 'landscape:hidden'}">
  <img class="image image-stroke ${ADAPTIVE}" src="${TITLE_ICON}" alt="">
  <span class="title${narrow ? '{% if flower_code %} hidden lg:inline-block{% endif %}' : ''}">Little Plot</span>
  {% if flower_code %}<span class="instance">${short ? 'Flower' : 'Flower code'} {{ flower_code | escape }}</span>{% endif %}
</div>`

/** D180: while this week's flower waits and the code is not sending ripe beds to the companion, the standing code opens the claim link, captioned with the code. */
const FLOWER_ASSIGNS = `{% assign flower_waiting = false %}{% if flower_code and flower_qr_base and flower_qr_base != "" and qr_base != "" and qr != "ripe" %}{% assign flower_waiting = true %}{% assign qr_base = flower_qr_base %}{% endif %}`

const oriented = (classes: string, landscape: string, portrait: string, narrow = false) => `${ASSIGNS}${FLOWER_ASSIGNS}${aliasStyle}${fitStories}
<div class="${classes} portrait:hidden">${landscape}
</div>${titleBar('landscape', false, narrow)}
<div class="${classes} landscape:hidden">${portrait}
</div>${titleBar('portrait', narrow)}`

/**
 * The scene for one slot: the OG's stage width and scale, then the X's, each the slot's width over the scale so the
 * image fills the slot edge to edge (the same widths Idle Angler's template measured, D125).
 */
const scene = (og: readonly [width: number, scale: number], x: readonly [width: number, scale: number], classes = 'stretch-x') =>
  `{% if scene_base != "" %}<div class="${classes} no-shrink flex flex--row flex--center-x" data-give-way="7"><img class="image lg:hidden" src="{{ scene_base }}/${og[0]}/${og[1]}.png" alt=""><img class="image hidden lg:block" src="{{ scene_base }}/${x[0]}/${x[1]}.png" alt=""></div>{% endif %}`

const qr = (og: number, x: number, beside = false) => {
  const caption = `{% if flower_waiting %}<span class="${LABEL} ${beside ? 'text--right' : 'text--center'} text--bold" data-flower-caption="true">Flower&nbsp;{{ flower_code | escape | replace: " ", "&nbsp;" }}</span>{% endif %}`
  const code = `<img class="image lg:hidden" src="{{ qr_base }}/${og}.png" alt=""><img class="image hidden lg:block" src="{{ qr_base }}/${x}.png" alt="">`
  return `{% if qr_base != "" %}<div class="no-shrink flex ${beside ? 'flex--row flex--bottom gap--small' : 'flex--col flex--center-x gap--xsmall'}" data-companion-qr="true">${beside ? caption + code : code + caption}</div>{% endif %}`
}

/**
 * The alias, then the level beside it. The alias ellipsizes by CSS (`aliasStyle`) rather than the framework's single-line
 * clamp: that clamp rounds the box width down and the text width up, so on the X (drawn at 1.8x) a short alias whose scaled
 * width lands just above a whole pixel (Mo at 44.3px) fails its own fit test and becomes an ellipsis.
 */
const nameLine = (classes = 'title title--small') =>
  `<div class="flex flex--row flex--left flex--center-y gap--[4px] w--min-0" data-name-row="true"><span class="${classes} w--min-0" data-alias="true">{{ alias | escape }}</span>{% if level %}<span class="${LABEL} no-shrink">&middot;&nbsp;Level {{ level }}</span>{% endif %}</div>`

/** The ripe, goal or service line, inverted behind its mark so it reads first. */
const attention = (clamp = 2) =>
  `{% if attention %}{% case attention_kind %}{% when "ripe" %}{% assign m_attention = m_ripe %}{% when "goal" %}{% assign m_attention = m_goal %}{% else %}{% assign m_attention = m_system %}{% endcase %}` +
  `<div class="flex flex--row flex--left flex--center-y gap--small no-shrink stretch-x" data-attention="{{ attention_kind }}"><img class="${ICON}" src="{{ m_attention }}" alt=""><span class="${LABEL} label--inverted" data-clamp="${clamp}">{{ attention | escape }}</span></div>{% endif %}`

/** One story's glyph by the payload's glyph name. */
const storyGlyph = `{% case story.glyph %}${STORY_GLYPHS.filter((g) => g !== 'system')
  .map((g) => `{% when "${g}" %}{% assign m_story = m_${g} %}`)
  .join('')}{% else %}{% assign m_story = m_system %}{% endcase %}`

/** The current goal under its pennant, with a rule under it; while rewards wait and the attention line does not say so, the row inverts to them. */
const goal = () =>
  `{% if goal_claim %}{% unless attention_kind == "goal" %}<div class="flex flex--row flex--left flex--center-y gap--small no-shrink stretch-x" data-goal-claim="true"><img class="${ICON}" src="{{ m_goal }}" alt=""><span class="${LABEL} label--inverted w--min-0" data-clamp="1">{% if goal_claim.count > 1 %}{{ goal_claim.count }} goals{% else %}Goal{% endif %} reached! Claim {{ goal_claim.coins }} coins in the companion.</span></div>{% endunless %}` +
  `{% elsif goal_line %}<div class="no-shrink stretch-x flex flex--col gap--xsmall" data-goal="true"><div class="flex flex--row flex--left flex--center-y gap--small stretch-x"><img class="${ICON}" src="{{ m_goal }}" alt=""><div class="flex flex--row flex--left flex--center-y gap--[4px] grow w--min-0"><span class="${LABEL} text--bold no-shrink">Goal:</span><span class="${LABEL} grow w--min-0" data-clamp="1">{{ goal_line | escape }}</span></div></div><div class="border--h-30 stretch-x"></div></div>{% endif %}`

const storyTime = (classes: string) => `{% if utc_offset != nil and story.u %}<span class="${classes} no-shrink" data-story-time="true">{{ story.u | plus: utc_offset | date: "%H:%M" }}</span>{% endif %}`

const storyList = (limit: number, clamp: number, classes: string, show: string) =>
  `<div class="columns ${show} flex-auto h--min-0 w--full" data-stories="true" data-fit-stories="true"><div class="column flex--col flex--top"><div class="flex flex--col flex--left gap--[3px] w--full">{% for story in stories limit:${limit} %}${storyGlyph}<div class="item flex flex--row flex--top gap--small stretch-x" data-story="{{ story.kind }}"><img class="${ICON}" src="{{ m_story }}" alt=""><span class="${classes} grow w--min-0" data-clamp="${clamp}">{{ story.summary | escape }}</span>${storyTime(classes)}</div>{% endfor %}</div></div></div>`
const stories = (limit: number, clamp = 1, classes = 'description lg:title--small') => storyList(limit, clamp, classes, 'lg:hidden') + storyList(limit, 1, classes, 'hidden lg:flex')

/** Fit the story lists once the framework has laid out the view (Idle Angler's template v17 pass): whole stories only, and the lesser counters step aside where no story fits. */
const aliasStyle = `<style>[data-alias]{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}</style>`

const fitStories = `<script>
(() => {
  const view = document.currentScript.closest('.view');
  if (!view) return;
  const shown = (el) => el.getClientRects().length > 0;
  const fitLayout = (layout) => {
    if (!shown(layout)) return;
    const lists = Array.from(layout.querySelectorAll('[data-fit-stories]')).filter(shown);
    const extras = Array.from(layout.querySelectorAll('[data-give-way]')).sort((a, b) => a.dataset.giveWay - b.dataset.giveWay);
    extras.forEach((extra) => extra.classList.remove('hidden'));
    const wantStory = !layout.querySelector('[data-attention]') && lists.some((list) => list.querySelector('.item'));
    const place = () => lists.reduce((total, list) => {
      const items = Array.from(list.querySelectorAll('.item'));
      items.forEach((item) => item.classList.remove('hidden'));
      const bottom = list.getBoundingClientRect().bottom;
      let count = items.length;
      while (count && items[count - 1].getBoundingClientRect().bottom > bottom + 0.5) items[--count].classList.add('hidden');
      list.dataset.storyCount = String(count);
      return total + count;
    }, 0);
    const spills = () => {
      const bottom = layout.getBoundingClientRect().bottom + 0.5;
      return Array.from(layout.querySelectorAll('*')).some((el) => shown(el) && el.getBoundingClientRect().bottom > bottom);
    };
    const short = (count) => spills() || (wantStory && !count);
    let count = place();
    const hidden = [];
    for (const extra of extras) {
      if (!short(count)) break;
      extra.classList.add('hidden');
      hidden.push(extra);
      count = place();
    }
    for (const extra of hidden.reverse()) {
      extra.classList.remove('hidden');
      const restored = place();
      if (short(restored)) { extra.classList.add('hidden'); count = place(); } else count = restored;
    }
  };
  const fit = () => view.querySelectorAll('.layout').forEach(fitLayout);
  window.addEventListener('trmnl:terminalize:stats', fit);
  window.addEventListener('load', () => { if (window.TRMNL_PLUGINS_READY) fit(); }, { once: true });
  if (window.TRMNL_PLUGINS_READY) fit();
})();
</script>`

/** This week's Top 5 of the plot's level group: the trophy, the plot's own rank, then each row's name and level. */
const board = (rows: number) =>
  `{% if board %}<div class="no-shrink flex flex--col gap--xsmall w--full" data-board="true" data-give-way="-1">` +
  `<div class="flex flex--row flex--center-y gap--[3px] w--full"><img class="${ICON}" src="{{ m_trophy }}" alt=""><span class="${LABEL} grow w--min-0" data-clamp="1">{{ board.label | escape }}</span></div>` +
  `<span class="${LABEL} w--full" data-clamp="1">{{ board.own_label | escape }}</span>` +
  `{% for row in board.rows limit:${rows} %}<div class="${LABEL} flex flex--row flex--between flex--center-y gap--small w--full{% if row.own %} label--inverted{% endif %}" data-rank-row="{{ row.rank }}"><span class="grow w--min-0" data-clamp="1">{{ row.rank }}. {{ row.name | escape }}</span><span class="no-shrink">L{{ row.level }}</span></div>{% endfor %}</div>{% endif %}`

/** The twelve-hour recap as a ribbon: a rule, its name in bold and each fact behind its mark. */
const recap = () =>
  `{% if recap_items %}<div class="no-shrink stretch-x" data-recap="true" data-give-way="0"><div class="border--h-30 stretch-x"></div>` +
  `<div class="pt--2 flex flex--row flex--wrap flex--left flex--center-y gap--small stretch-x"><span class="${LABEL} text--bold no-shrink">Last 12 hours</span>` +
  `{% for item in recap_items %}{% case item.k %}{% when "pest" %}{% assign m_recap = m_pest %}{% when "deterred" %}{% assign m_recap = m_gnome %}{% when "visit" %}{% assign m_recap = m_visit %}{% else %}{% assign m_recap = m_ripe %}{% endcase %}` +
  `<div class="flex flex--row flex--center-y gap--[3px] no-shrink" data-recap-item="{{ item.k }}"><img class="${ICON}" src="{{ m_recap }}" alt=""><span class="${LABEL}">{{ item.text | escape }}</span></div>{% endfor %}</div></div>{% endif %}`

/** Before activation: the plot as sown, what to do next and the code to the companion. */
const welcome = ({ art = '', arrange, qrOg, qrX, small = false }: { art?: string; arrange: 'row' | 'col'; qrOg: number; qrX: number; small?: boolean }) => `
  <div class="flex flex--col flex--center-x flex--center-y gap--medium stretch-x grow" data-welcome="true">${art}
    <div class="flex flex--${arrange} flex--center-x flex--center-y gap--medium stretch-x">
      ${qr(qrOg, qrX)}
      <div class="flex flex--col flex--center-x gap--xsmall w--min-0">
        <span class="${small ? 'title title--small' : 'title'} lg:title--large text--center">{% if status == "pending" %}{{ alias | escape }}'s plot is ready{% elsif data_state == "service_paused" %}Back soon{% else %}Finish setting up{% endif %}</span>
        <span class="label lg:title--small text--center" data-clamp="3">{% if status == "pending" %}Save the plugin in TRMNL. The seeds start growing within 15 minutes.{% else %}{{ attention | escape }}{% endif %}</span>
        <span class="label lg:title--small">trmnlgames.com</span>
      </div>
    </div>
  </div>`

const ready = (body: string, before: string) => `{% if status == "unlinked" or status == "pending" %}${before}{% else %}${body}{% endif %}`

/** The full header: alias and level; the season and conditions; the counters; the code in the corner. */
const header = (qrOg: number, qrX: number, beside = false) => `
    <div class="no-shrink flex flex--row flex--between flex--top gap--small stretch-x">
      <div class="flex flex--col flex--left gap--xsmall grow w--min-0">
        <div class="flex flex--row flex--wrap flex--left flex--center-y gap--small stretch-x">${nameLine()}</div>
        ${statusRow()}
        ${counters()}
      </div>
      ${qr(qrOg, qrX, beside)}
    </div>`

const full = oriented(
  'layout layout--col layout--top layout--stretch-x gap--small lg:gap--large',
  ready(`${header(2, 3, true)}
    <div class="lg:hidden no-shrink stretch-x">{% if board %}<div class="flex flex--row flex--top gap--medium stretch-x">${scene([152, 4], [152, 4], '')}<div class="grow w--min-0">${board(5)}</div></div>{% else %}${scene([156, 5], [156, 5])}{% endif %}</div>
    <div class="lg:hidden flex flex--col flex--left flex--top gap--small flex-auto h--min-0 w--full">${attention(1)}${goal()}${stories(16)}</div>
    <div class="hidden lg:flex flex--col flex--left flex--top gap--medium flex-auto h--min-0 w--full">${scene([170, 6], [170, 6])}${attention(1)}
      <div class="flex flex--row flex--stretch gap--large flex-auto h--min-0 w--full"><div class="grow w--min-0 flex flex--col flex--left gap--small">${goal()}${stories(16, 2)}</div><div class="no-shrink flex flex--col flex--left gap--medium">${board(6)}</div></div>
    </div>
    ${recap()}`, welcome({ art: scene([156, 5], [170, 6]), arrange: 'row', qrOg: 3, qrX: 4 })),
  ready(`${header(2, 3)}
    ${scene([153, 3], [152, 5])}
    ${attention(3)}
    ${goal()}
    ${stories(16, 2, 'label')}
    ${board(6)}
    ${recap()}`, welcome({ art: scene([153, 3], [152, 5]), arrange: 'col', qrOg: 3, qrX: 5 })),
)

const halfHorizontal = oriented(
  'layout layout--row layout--left layout--stretch-y gap--medium',
  ready(`
    <div class="no-shrink flex flex--col flex--center-y gap--small">${scene([120, 3], [168, 3])}</div>
    <div class="flex flex--col flex--left gap--xsmall grow w--min-0 h--full">
      <div class="flex flex--row flex--wrap flex--left flex--center-y gap--small stretch-x">${nameLine()}</div>
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
    ${header(2, 2)}
    ${scene([182, 2], [161, 3])}
    ${attention()}
    ${goal()}
    ${stories(16, 2)}
    ${recap()}`, welcome({ art: scene([182, 2], [161, 3]), arrange: 'col', qrOg: 3, qrX: 5 })),
  ready(`
    <div class="no-shrink flex flex--row flex--left flex--center-y gap--small stretch-x">${nameLine('title title--small')}</div>
    ${scene([205, 1], [177, 2])}
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
        ${counters('compact')}
      </div>
      ${qr(2, 3)}
    </div>
    ${attention(2)}
    ${stories(16, 2)}`, welcome({ arrange: 'row', qrOg: 2, qrX: 3, small: true })),
  ready(`
    <div class="no-shrink flex flex--row flex--left flex--center-y gap--small stretch-x">${nameLine('title title--small')}</div>
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
