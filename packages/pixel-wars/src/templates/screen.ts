import { markUri, STORY_GLYPHS, SWATCHES, type PwMark } from '../art/marks'
import { PATTERNS } from '../art/render'

/**
 * Pixel Wars screen markup (pixel-wars.md "Device"). TRMNL framework 3.4 Liquid over the flat payload
 * (lib/payload.ts). TRMNL wraps each layout in its own `.view`, so markup starts at the layout and closes with the
 * title bar. Each layout has a landscape and a portrait arrangement; the map comes as one image per slot and screen
 * (`map_<slot>_og`, `map_<slot>_x`), each a window already sized for that slot, so nothing is scaled in the browser
 * beyond the X's own 1.8x draw of every image.
 *
 * Template v1 (D214, W3): the alias behind its faction's swatch and the level; the four factions' shares with the hour's
 * movement, the player's own inverted; the desk line (held and how full, or who holds it); the attention line
 * inverted behind its mark (a fallen desk, no side yet, the bell, a service note); the map; the map's lines; the
 * desk's own stories fitted by measurement (Idle Angler's template v17 pass); the seven-day Top 5; the companion code.
 */
export const TEMPLATE_VERSION = 1

const svgDataUri = (svg: string) => `data:image/svg+xml;base64,${btoa(svg)}`

/** Title-bar icon: four cells, two inked. Inline, so it never needs the network. */
const TITLE_ICON = svgDataUri(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="black" shape-rendering="crispEdges">' +
    '<rect x="2" y="2" width="9" height="9"/><rect x="13" y="13" width="9" height="9"/><rect x="13" y="2" width="9" height="9" fill="none" stroke="black" stroke-width="2"/><rect x="2" y="13" width="9" height="9" fill="none" stroke="black" stroke-width="2"/></svg>',
)

const MARKS: readonly PwMark[] = ['drop', 'desk', 'bell', 'shield', 'star', 'goal', 'trophy', 'fell', 'recovered', 'taken', 'flips', 'refund', 'rosette', 'system']
const ASSIGNS = MARKS.map((mark) => `{% assign m_${mark} = "${markUri(mark, 32)}" %}`).join('') + PATTERNS.map((p) => `{% assign sw_${p} = "${SWATCHES[p]}" %}`).join('')

/** D181: the framework repaints `image--adaptive` marks in the theme's ink, so they stay visible under TRMNL's Dark theme. */
const ADAPTIVE = 'image--adaptive'
const ICON = `w--[16px] h--[16px] lg:w--[20px] lg:h--[20px] no-shrink ${ADAPTIVE}`
const SWATCH = `w--[14px] h--[14px] lg:w--[18px] lg:h--[18px] no-shrink ${ADAPTIVE}`
const LABEL = 'label lg:title--small'

const swatchFor = (patternVar: string) => `{% case ${patternVar} %}{% when "hatch" %}{% assign m_sw = sw_hatch %}{% when "dots" %}{% assign m_sw = sw_dots %}{% when "weave" %}{% assign m_sw = sw_weave %}{% else %}{% assign m_sw = sw_solid %}{% endcase %}`

/** The alias behind its swatch, then the level. The alias ellipsizes by CSS (D211). */
const nameLine = (classes = 'title title--small') =>
  `<div class="flex flex--row flex--left flex--center-y gap--[4px] w--min-0" data-name-row="true">{% if faction_pattern and faction_pattern != "" %}${swatchFor('faction_pattern')}<img class="${SWATCH}" src="{{ m_sw }}" alt="">{% endif %}<span class="${classes} w--min-0" data-alias="true">{{ alias | escape }}</span>{% if level %}<span class="${LABEL} no-shrink">&middot;&nbsp;Level {{ level }}</span>{% endif %}{% if rosette %}<img class="${ICON}" src="{{ m_rosette }}" alt="" data-rosette="true">{% endif %}</div>`

/** The four factions' shares, the player's own inverted, with the hour's movement; `compact` drops the names. */
const strip = (compact = false) =>
  `<div class="flex flex--row flex--wrap flex--left flex--center-y gap--small stretch-x" data-strip="true" data-give-way="4">{% for share in shares %}${swatchFor('share.pattern')}<div class="flex flex--row flex--center-y gap--[3px] no-shrink" data-share="{{ share.faction }}"><img class="${SWATCH}" src="{{ m_sw }}" alt=""><span class="${LABEL}{% if share.own %} label--inverted{% endif %}">${compact ? '' : '{{ share.name | escape }}&nbsp;'}<b>{{ share.percent }}%</b>{% if share.change > 0 %}&nbsp;+{{ share.change }}{% elsif share.change < 0 %}&nbsp;{{ share.change }}{% endif %}</span></div>{% endfor %}</div>`

/** The desk line: how full it is, or who holds it; the well; the cells held; the shield when it is up. */
const deskRow = (fit: 'all' | 'short' = 'all') =>
  `{% if status != "choose" %}<div class="flex flex--row flex--wrap flex--left flex--center-y gap--[6px] stretch-x" data-desk-row="true">` +
  `<div class="flex flex--row flex--center-y gap--[3px] no-shrink"><img class="${ICON}" src="{% if desk_fallen %}{{ m_fell }}{% else %}{{ m_desk }}{% endif %}" alt=""><span class="${LABEL}{% if desk_fallen %} text--bold{% endif %}">{{ desk_label | escape }}</span></div>` +
  `<div class="flex flex--row flex--center-y gap--[3px] no-shrink" data-well="{{ well }}" data-give-way="3"><img class="${ICON}" src="{{ m_drop }}" alt=""><span class="${LABEL}">{{ well }}/{{ well_cap }}</span></div>` +
  (fit === 'all' ? `<div class="flex flex--row flex--center-y gap--[3px] no-shrink" data-held="{{ held }}" data-give-way="2"><img class="${ICON}" src="{{ m_flips }}" alt=""><span class="${LABEL}">{{ held }} {% if held == 1 %}cell{% else %}cells{% endif %}</span></div>` : '') +
  `{% if shielded %}<div class="flex flex--row flex--center-y gap--[3px] no-shrink" data-shield="true" data-give-way="1"><img class="${ICON}" src="{{ m_shield }}" alt=""><span class="${LABEL}">Shield</span></div>{% endif %}` +
  `</div>{% endif %}`

/** The fallen, choose, bell or service line, inverted behind its mark so it reads first. */
const attention = (clamp = 2) =>
  `{% if attention %}{% case attention_kind %}{% when "fallen" %}{% assign m_attention = m_fell %}{% when "choose" %}{% assign m_attention = m_desk %}{% when "bell" %}{% assign m_attention = m_bell %}{% else %}{% assign m_attention = m_system %}{% endcase %}` +
  `<div class="flex flex--row flex--left flex--center-y gap--small no-shrink stretch-x" data-attention="{{ attention_kind }}"><img class="${ICON}" src="{{ m_attention }}" alt=""><span class="${LABEL} label--inverted" data-clamp="${clamp}">{{ attention | escape }}</span></div>{% endif %}`

/** The map for one slot: the OG's window and the X's, each sized for the slot (lib/payload.ts SLOTS). */
const mapImage = (slot: string, classes = 'stretch-x') =>
  `{% if map_${slot}_og %}<div class="${classes} no-shrink flex flex--row flex--center-x" data-map="${slot}"><img class="image lg:hidden" src="{{ map_${slot}_og }}" alt=""><img class="image hidden lg:block" src="{{ map_${slot}_x }}" alt=""></div>{% endif %}`

/** The map's own lines: what fell, what moved, what faded. */
const lines = (limit: number, clamp = 1) =>
  `{% if lines.size > 0 %}<div class="flex flex--col flex--left gap--[3px] stretch-x no-shrink" data-lines="true" data-give-way="5">{% for line in lines limit:${limit} %}<div class="flex flex--row flex--top gap--small stretch-x" data-line="true"><img class="${ICON}" src="{{ m_bell }}" alt=""><span class="${LABEL} grow w--min-0" data-clamp="${clamp}">{{ line | escape }}</span></div>{% endfor %}</div>{% endif %}`

const storyGlyph = `{% case story.glyph %}${STORY_GLYPHS.filter((g) => g !== 'system')
  .map((g) => `{% when "${g}" %}{% assign m_story = m_${g} %}`)
  .join('')}{% else %}{% assign m_story = m_system %}{% endcase %}`
const storyTime = (classes: string) => `{% if utc_offset != nil and story.u %}<span class="${classes} no-shrink" data-story-time="true">{{ story.u | plus: utc_offset | date: "%H:%M" }}</span>{% endif %}`
const storyList = (limit: number, clamp: number, classes: string, show: string) =>
  `<div class="columns ${show} flex-auto h--min-0 w--full" data-stories="true" data-fit-stories="true"><div class="column flex--col flex--top"><div class="flex flex--col flex--left gap--[3px] w--full">{% for story in stories limit:${limit} %}${storyGlyph}<div class="item flex flex--row flex--top gap--small stretch-x" data-story="{{ story.kind }}"><img class="${ICON}" src="{{ m_story }}" alt=""><span class="${classes} grow w--min-0" data-clamp="${clamp}">{{ story.summary | escape }}</span>${storyTime(classes)}</div>{% endfor %}</div></div></div>`
const stories = (limit: number, clamp = 1, classes = 'description lg:title--small') => storyList(limit, clamp, classes, 'lg:hidden') + storyList(limit, 1, classes, 'hidden lg:flex')

const aliasStyle = `<style>[data-alias]{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}</style>`

/** Fit the story lists once the framework has laid out the view (Idle Angler's template v17 pass): whole stories only, and the lesser rows step aside where no story fits. */
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

const board = (rows: number) =>
  `{% if board %}<div class="no-shrink flex flex--col gap--xsmall w--full" data-board="true" data-give-way="-1">` +
  `<div class="flex flex--row flex--center-y gap--[3px] w--full"><img class="${ICON}" src="{{ m_trophy }}" alt=""><span class="${LABEL} grow w--min-0" data-clamp="1">{{ board.label | escape }}</span></div>` +
  `<span class="${LABEL} w--full" data-clamp="1">{{ board.own_label | escape }}</span>` +
  `{% for row in board.rows limit:${rows} %}<div class="${LABEL} flex flex--row flex--between flex--center-y gap--small w--full{% if row.own %} label--inverted{% endif %}" data-rank-row="{{ row.rank }}"><span class="grow w--min-0" data-clamp="1">{{ row.rank }}. {{ row.name | escape }}</span><span class="no-shrink">L{{ row.level }}</span></div>{% endfor %}</div>{% endif %}`

const qr = (og: number, x: number) => `{% if qr_base != "" %}<div class="no-shrink flex flex--col flex--center-x gap--xsmall" data-companion-qr="true"><img class="image lg:hidden" src="{{ qr_base }}/${og}.png" alt=""><img class="image hidden lg:block" src="{{ qr_base }}/${x}.png" alt=""></div>{% endif %}`

/** The title bar with the time to the bell; a narrow portrait column (the OG's 205 px side) keeps the name and drops the label until the X. */
const titleBar = (orientation: 'landscape' | 'portrait', narrow = false) => `
<div class="title_bar ${orientation === 'landscape' ? 'portrait:hidden' : 'landscape:hidden'}">
  <img class="image image-stroke ${ADAPTIVE}" src="${TITLE_ICON}" alt="">
  <span class="title">Pixel Wars</span>
  <span class="instance${narrow ? ' hidden lg:inline-block' : ''}">{{ season_label | escape }}</span>
</div>`

const oriented = (classes: string, landscape: string, portrait: string, narrow = false) => `${ASSIGNS}${aliasStyle}${fitStories}
<div class="${classes} portrait:hidden">${landscape}
</div>${titleBar('landscape')}
<div class="${classes} landscape:hidden">${portrait}
</div>${titleBar('portrait', narrow)}`

/** Before activation: what to do next and the code to the companion. */
const welcome = ({ arrange, qrOg, qrX, small = false }: { arrange: 'row' | 'col'; qrOg: number; qrX: number; small?: boolean }) => `
  <div class="flex flex--col flex--center-x flex--center-y gap--medium stretch-x grow" data-welcome="true">
    <div class="flex flex--${arrange} flex--center-x flex--center-y gap--medium stretch-x">
      ${qr(qrOg, qrX)}
      <div class="flex flex--col flex--center-x gap--xsmall w--min-0">
        <span class="${small ? 'title title--small' : 'title'} lg:title--large text--center">{% if status == "pending" %}{{ alias | escape }}'s desk is ready{% elsif data_state == "service_paused" %}Back soon{% else %}Finish setting up{% endif %}</span>
        <span class="label lg:title--small text--center" data-clamp="3">{% if status == "pending" %}Save the plugin in TRMNL, then pick a side in the companion. Your desk joins the map within fifteen minutes.{% else %}{{ attention | escape }}{% endif %}</span>
        <span class="label lg:title--small">trmnlgames.com</span>
      </div>
    </div>
  </div>`

const ready = (body: string, before: string) => `{% if status == "unlinked" or status == "pending" %}${before}{% else %}${body}{% endif %}`

const header = (qrOg: number, qrX: number) => `
    <div class="no-shrink flex flex--row flex--between flex--top gap--small stretch-x">
      <div class="flex flex--col flex--left gap--xsmall grow w--min-0">
        <div class="flex flex--row flex--wrap flex--left flex--center-y gap--small stretch-x">${nameLine()}</div>
        ${strip()}
        ${deskRow()}
      </div>
      ${qr(qrOg, qrX)}
    </div>`

const full = oriented(
  'layout layout--col layout--top layout--stretch-x gap--small lg:gap--medium',
  ready(`${header(2, 3)}
    ${attention(1)}
    ${mapImage('full')}
    <div class="flex flex--row flex--top gap--medium flex-auto h--min-0 w--full">
      <div class="grow w--min-0 flex flex--col flex--left gap--small h--full">${lines(3)}${stories(12)}</div>
      <div class="no-shrink flex flex--col flex--left gap--small" style="">${board(5)}</div>
    </div>`, welcome({ arrange: 'row', qrOg: 3, qrX: 4 })),
  ready(`${header(2, 3)}
    ${attention(2)}
    ${mapImage('full_portrait')}
    ${lines(3, 2)}
    ${stories(12, 2, 'label')}
    ${board(5)}`, welcome({ arrange: 'col', qrOg: 3, qrX: 5 })),
)

const halfHorizontal = oriented(
  'layout layout--row layout--left layout--stretch-y gap--medium',
  ready(`
    <div class="flex flex--col flex--left gap--xsmall grow w--min-0 h--full">
      <div class="flex flex--row flex--wrap flex--left flex--center-y gap--small stretch-x">${nameLine()}</div>
      ${strip(true)}
      ${deskRow('short')}
      ${attention(1)}
      ${lines(1)}
      ${stories(12, 1)}
    </div>
    <div class="no-shrink flex flex--col flex--center-y gap--small">${mapImage('half', '')}</div>
    ${qr(2, 4)}`, welcome({ arrange: 'row', qrOg: 3, qrX: 4, small: true })),
  ready(`
    <div class="flex flex--col flex--left gap--small grow w--min-0 h--full">
      <div class="flex flex--row flex--center-y gap--small stretch-x"><div class="flex flex--row flex--left flex--center-y gap--small grow w--min-0">${nameLine()}</div>${qr(2, 4)}</div>
      ${mapImage('half_portrait')}
      ${strip(true)}
      ${deskRow('short')}
      ${attention()}
      ${stories(12, 2)}
    </div>`, welcome({ arrange: 'row', qrOg: 2, qrX: 4, small: true })),
)

const halfVertical = oriented(
  'layout layout--col layout--top layout--stretch-x gap--small',
  ready(`
    ${header(2, 2)}
    ${attention()}
    ${mapImage('side')}
    ${lines(2, 2)}
    ${stories(12, 2)}`, welcome({ arrange: 'col', qrOg: 3, qrX: 5 })),
  ready(`
    <div class="no-shrink flex flex--row flex--left flex--center-y gap--small stretch-x">${nameLine('title title--small')}</div>
    ${mapImage('side_portrait')}
    ${strip(true)}
    ${deskRow('short')}
    ${attention(3)}
    ${stories(12, 3, 'description')}
    ${board(5)}
    <div class="no-shrink flex flex--row flex--center-x stretch-x">${qr(2, 4)}</div>`, welcome({ arrange: 'col', qrOg: 3, qrX: 5 })),
  true,
)

const quadrant = oriented(
  'layout layout--col layout--top layout--stretch-x gap--small',
  ready(`
    <div class="no-shrink flex flex--row flex--top gap--small stretch-x">
      <div class="flex flex--col flex--left gap--xsmall grow w--min-0">
        <div class="flex flex--row flex--left flex--center-y gap--small stretch-x">${nameLine('title title--small')}</div>
        ${strip(true)}
        ${deskRow('short')}
      </div>
      ${qr(2, 3)}
    </div>
    ${attention(2)}
    <div class="flex flex--row flex--top gap--small flex-auto h--min-0 w--full">${mapImage('quad', '')}<div class="grow w--min-0 h--full flex flex--col">${stories(12, 2)}</div></div>`, welcome({ arrange: 'row', qrOg: 2, qrX: 3, small: true })),
  ready(`
    <div class="no-shrink flex flex--row flex--left flex--center-y gap--small stretch-x">${nameLine('title title--small')}</div>
    ${strip(true)}
    ${deskRow('short')}
    ${attention(3)}
    ${mapImage('quad_portrait')}
    ${stories(12, 3, 'description')}
    <div class="no-shrink flex flex--row flex--center-x stretch-x">${qr(2, 4)}</div>`, welcome({ arrange: 'col', qrOg: 2, qrX: 3, small: true })),
  true,
)

export const screenMarkup = {
  markup: full,
  markup_half_horizontal: halfHorizontal,
  markup_half_vertical: halfVertical,
  markup_quadrant: quadrant,
} as const
