/**
 * Paper Lives screen markup (paper-lives.md "Device"). TRMNL framework 3.4 Liquid over the flat payload (payload.ts).
 * TRMNL wraps each layout in its own `.view`, so markup starts at the layout and closes with the title bar. Each
 * layout has a landscape and a portrait arrangement; images are whole-number scales of 1-bit art (`portrait_base` and
 * `qr_base` plus `/<scale>.png`), and `lg:` swaps in the TRMNL X's scales. There is no painted scene: the device is a
 * portrait and a diary column. User text arrives only as escaped variables.
 *
 * Template v1 (D159, L3): the portrait with the pet, the name and age, the status line, the traits, four stat bars
 * and money, the newest lines with their ages, the decision prompt or the close time, the recap, this week's longest
 * lives and the code; a memorial swaps the column for the framed portrait and the epitaph.
 *
 * Template v2 (D159, L6): the weekly photo code in the title bar, as Idle Angler's fly code.
 *
 * Template v3: the close line reads "The year ends at 18:00" or "The year ends later today"; the winding-down sentence went,
 * since it pushed the time off the half-width line. The payload still carries `year_end`.
 */
import { markUri, STORY_GLYPHS, type PlMark } from '../art/marks'

export const TEMPLATE_VERSION = 3

const svgDataUri = (svg: string) => `data:image/svg+xml;base64,${btoa(svg)}`

/** Title-bar icon: a page with a folded corner. Inline, so it never needs the network. */
const TITLE_ICON = svgDataUri(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="square">' +
    '<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4"/><path d="M8 11h8M8 15h8M8 19h5"/></svg>',
)

const MARKS: readonly PlMark[] = ['statHealth', 'statHappy', 'statSmarts', 'statCharm', 'money', 'trophy', 'clock', 'decision', 'tickEmpty', 'tickHalf', 'tickFull', ...STORY_GLYPHS]
const ASSIGNS = MARKS.map((mark) => `{% assign m_${mark} = "${mark.startsWith('tick') ? markUri(mark, 36, 16) : markUri(mark, 32)}" %}`).join('')

/** 16px on the OG; 20px on the X, where the text beside it is larger. */
const ICON = 'w--[16px] h--[16px] lg:w--[20px] lg:h--[20px] no-shrink'
const LABEL = 'label lg:title--small'

/** The portrait at the OG's scale, then the X's (the X draws images at 1.8x, so its scale is smaller per pixel). */
const portrait = (og: number, x: number) =>
  `{% if portrait_base != "" %}<div class="no-shrink" data-portrait="true"><img class="image lg:hidden" src="{{ portrait_base }}/${og}.png" alt=""><img class="image hidden lg:block" src="{{ portrait_base }}/${x}.png" alt=""></div>{% endif %}`

const qr = (og: number, x: number) =>
  `{% if qr_base != "" %}<div class="no-shrink" data-companion-qr="true"><img class="image lg:hidden" src="{{ qr_base }}/${og}.png" alt=""><img class="image hidden lg:block" src="{{ qr_base }}/${x}.png" alt=""></div>{% endif %}`

/** The name and the age beside it. */
const nameLine = (classes = 'title title--small') =>
  `<div class="flex flex--row flex--left flex--center-y gap--small stretch-x" data-name-row="true"><span class="${classes} grow w--min-0" data-clamp="2">{{ name | escape }}</span><span class="${LABEL} no-shrink">Age {{ age }}</span></div>`

/** "nurse, renting" under the name and age: the rest of the status line, which never uses pronouns. */
const statusLine = (clamp = 1) => `<span class="${LABEL} w--min-0" data-clamp="${clamp}">{{ status_detail | escape }}</span>`

const traits = `{% if traits_label %}<span class="${LABEL} w--min-0" data-clamp="2" data-traits="true">{{ traits_label | escape }}</span>{% endif %}`

/** Four stats as five ticks each in half steps, behind their marks, then money behind the coin. */
const stats = (withMoney = true) =>
  `{% if stat_rows %}<div class="flex flex--col flex--left gap--xsmall no-shrink" data-stats="true">{% for stat in stat_rows %}` +
  `{% case stat.k %}{% when "health" %}{% assign m_stat = m_statHealth %}{% when "happiness" %}{% assign m_stat = m_statHappy %}{% when "smarts" %}{% assign m_stat = m_statSmarts %}{% else %}{% assign m_stat = m_statCharm %}{% endcase %}` +
  `<div class="flex flex--row flex--left flex--center-y gap--small" data-stat="{{ stat.k }}" data-stat-halves="{{ stat.halves }}"><img class="${ICON}" src="{{ m_stat }}" alt=""><div class="flex flex--row gap--[2px] no-shrink">{% for i in (1..5) %}{% assign tick_right = i | times: 2 %}{% assign tick_left = tick_right | minus: 1 %}<img class="w--[18px] h--[8px] lg:w--[22px] lg:h--[10px] no-shrink" src="{% if stat.halves >= tick_right %}{{ m_tickFull }}{% elsif stat.halves >= tick_left %}{{ m_tickHalf }}{% else %}{{ m_tickEmpty }}{% endif %}" alt="">{% endfor %}</div></div>{% endfor %}` +
  (withMoney ? `<div class="flex flex--row flex--left flex--center-y gap--small" data-money="true"><img class="${ICON}" src="{{ m_money }}" alt=""><span class="${LABEL}">{{ money_label }}</span></div>` : '') +
  `</div>{% endif %}`

/**
 * The year's decision, inverted behind its mark so it reads first; otherwise when the year closes by itself, in the
 * owner's local time (D42: 24-hour HH:MM, no zone, omitted without an offset).
 */
const prompt = (clamp = 2) =>
  `{% if decision %}<div class="flex flex--row flex--left flex--top gap--small stretch-x no-shrink" data-decision="{% if decision.major %}major{% else %}minor{% endif %}"><img class="${ICON}" src="{{ m_decision }}" alt=""><span class="${LABEL} label--inverted w--min-0" data-clamp="${clamp}">{{ decision.age }}: {{ decision.prompt | escape }} Decide in the companion.</span></div>` +
  `{% elsif closes_at %}<div class="flex flex--row flex--left flex--center-y gap--small stretch-x no-shrink" data-close="true"><img class="${ICON}" src="{{ m_clock }}" alt=""><span class="${LABEL} w--min-0" data-clamp="1">The year ends{% if utc_offset != nil %} at {{ closes_at | plus: utc_offset | date: "%H:%M" }}{% else %} later today{% endif %}</span></div>{% endif %}`

/** One line's glyph by the story's own glyph name. */
const lineGlyph = `{% case line.glyph %}${STORY_GLYPHS.filter((g) => g !== 'none')
  .map((g) => `{% when "${g}" %}{% assign m_line = m_${g} %}`)
  .join('')}{% else %}{% assign m_line = m_none %}{% endcase %}`

/** The newest lines, each behind its glyph and marked with the age it happened at. */
const lines = (limit: number, clamp = 1, classes = 'description lg:title--small') =>
  `<div class="flex flex--col flex--left gap--xsmall stretch-x h--min-0" data-lines="true">{% for line in lines limit:${limit} %}${lineGlyph}<div class="flex flex--row flex--top gap--small stretch-x" data-line="{{ line.glyph }}"><img class="${ICON}" src="{{ m_line }}" alt=""><span class="${classes} grow w--min-0" data-clamp="${clamp}">{{ line.age }}: {{ line.summary | escape }}</span></div>{% endfor %}</div>`

/** The last year's recap under a rule, held at the foot of the layout. */
const recap = `{% if recap %}<div class="grow"></div><div class="no-shrink stretch-x" data-recap="true"><div class="border--h-30 stretch-x"></div><span class="pt--2 ${LABEL} text--bold" data-clamp="1">{{ recap | escape }}</span></div>{% endif %}`

/** This week's longest lives: each row the life's name and age, the owner's own inverted; their best below when not listed. */
const board = (rows: number) =>
  `{% if board %}<div class="no-shrink flex flex--col gap--xsmall w--full" data-board="true">` +
  `<div class="flex flex--row flex--center-y gap--[3px] w--full"><img class="${ICON}" src="{{ m_trophy }}" alt=""><span class="${LABEL} grow w--min-0" data-clamp="1">{{ board.label | escape }}</span></div>` +
  `{% for row in board.rows limit:${rows} %}<div class="${LABEL} flex flex--row flex--between flex--center-y gap--small w--full{% if row.own %} label--inverted{% endif %}" data-rank-row="{{ row.rank }}"><span class="grow w--min-0" data-clamp="1">{{ row.rank }}. {{ row.life | escape }}</span><span class="no-shrink">{{ row.age }}</span></div>{% endfor %}` +
  `{% unless board.own_listed %}<span class="${LABEL} w--full" data-clamp="1">{{ board.own_label | escape }}</span>{% endunless %}</div>{% endif %}`

const attention = (clamp = 1) =>
  `{% if attention %}<div class="flex flex--row flex--left flex--center-y gap--small no-shrink stretch-x" data-attention="true"><img class="${ICON}" src="{{ m_none }}" alt=""><span class="${LABEL} label--inverted" data-clamp="${clamp}">{{ attention | escape }}</span></div>{% endif %}`

/** The memorial's words: the name, the age and generation, the epitaph, the way they died and what to do next. */
const memorialText = (compact: boolean) =>
  `<div class="flex flex--col flex--left gap--xsmall grow w--min-0" data-memorial="true">` +
  `<span class="${compact ? 'title title--small' : 'title'} lg:title--large w--min-0" data-clamp="2">{{ name | escape }}</span>` +
  `<span class="${LABEL}" data-clamp="2">Aged {{ memorial.age }}. {{ generation_label | escape }}</span>` +
  `{% if memorial.epitaph %}<span class="${compact ? 'description lg:title--small' : 'title title--small'}" data-clamp="${compact ? 2 : 3}">{{ memorial.epitaph | escape }}</span>{% endif %}` +
  (compact ? '' : `{% if memorial.line %}<span class="${LABEL}" data-clamp="2">{{ memorial.line | escape }}</span>{% endif %}`) +
  `<span class="${LABEL} text--bold" data-clamp="2">{{ memorial.prompt | escape }}</span></div>`

/** Before activation: what to do next and the code to the companion. */
const welcome = (compact: boolean) => `
  <div class="flex flex--${compact ? 'row' : 'col'} flex--center-x flex--center-y gap--medium stretch-x grow">
    ${qr(compact ? 2 : 3, compact ? 3 : 4)}
    <div class="flex flex--col flex--center-x gap--xsmall">
      <span class="${compact ? 'title title--small' : 'title'} lg:title--large text--center" data-clamp="2">{% if status == "pending" %}{{ name | escape }} is about to be born{% elsif data_state == "service_paused" %}Back soon{% else %}Finish setting up{% endif %}</span>
      <span class="label lg:title--small text--center" data-clamp="3">{% if status == "pending" %}Save the plugin in TRMNL. The first year starts within 15 minutes.{% else %}{{ attention | escape }}{% endif %}</span>
      <span class="label lg:title--small">trmnlgames.com</span>
    </div>
  </div>`

/** The live screen, the memorial or the welcome. */
const ready = (live: string, memorial: string, compact = false) => `{% if status == "unlinked" or status == "pending" %}${welcome(compact)}{% elsif status == "ended" %}${memorial}{% else %}${live}{% endif %}`

/**
 * The title bar with the weekly photo code. A narrow portrait column (side, quarter) cannot fit the name beside the
 * code, so while a code shows it takes the name's place there with the short label, as Idle Angler's fly code does.
 */
const titleBar = (orientation: 'landscape' | 'portrait', narrow = false) => `
<div class="title_bar ${orientation === 'landscape' ? 'portrait:hidden' : 'landscape:hidden'}">
  <img class="image image-stroke" src="${TITLE_ICON}" alt="">
  <span class="title${narrow ? '{% if photo_code %} hidden lg:inline-block{% endif %}' : ''}">Paper Lives</span>
  {% if photo_code %}<span class="instance">${narrow ? 'Photo' : 'Photo code'} {{ photo_code | escape }}</span>{% endif %}
</div>`

/** One layout in both orientations, each followed by its own title bar; the marks are assigned once ahead of both. */
const oriented = (classes: string, landscape: string, portraitMarkup: string, narrowPortrait = false) => `${ASSIGNS}
<div class="${classes} portrait:hidden">${landscape}
</div>${titleBar('landscape')}
<div class="${classes} landscape:hidden">${portraitMarkup}
</div>${titleBar('portrait', narrowPortrait)}`

/** The left column of the full landscape: portrait, name, status, traits and the stats. */
const card = (og: number, x: number) => `
      <div class="no-shrink flex flex--col flex--left flex--top gap--small w--44 lg:w--72 h--full" data-card="true">
        ${portrait(og, x)}
        ${nameLine()}
        ${statusLine(2)}
        ${traits}
        ${stats()}
      </div>`

const full = oriented(
  'layout layout--row layout--left layout--top layout--stretch-y gap--medium lg:gap--large',
  ready(
    `${card(3, 4)}
      <div class="flex flex--col flex--left gap--small grow w--min-0 h--full">
        ${attention()}
        ${prompt(2)}
        {% if decision or attention %}${lines(5, 2)}{% else %}${lines(6, 2)}{% endif %}
        ${recap}
      </div>
      <div class="no-shrink flex flex--col flex--left flex--top gap--medium w--44 lg:w--56 h--full">
        ${board(5)}
        <div class="grow"></div>
        <div class="flex flex--row flex--right stretch-x">${qr(2, 4)}</div>
      </div>`,
    `<div class="no-shrink flex flex--col flex--center-y h--full">${portrait(3, 4)}</div>
      ${memorialText(false)}
      <div class="no-shrink flex flex--col flex--bottom h--full">${qr(2, 4)}</div>`,
  ),
  ready(
    `<div class="flex flex--col flex--left gap--small stretch-x h--full">
      <div class="no-shrink flex flex--row flex--left flex--top gap--medium stretch-x">
        ${portrait(2, 3)}
        <div class="flex flex--col flex--left gap--xsmall grow w--min-0">${nameLine()}${statusLine(2)}${traits}</div>
        ${qr(2, 4)}
      </div>
      ${stats()}
      ${attention(2)}
      ${prompt(3)}
      ${lines(5, 2, 'label lg:title--small')}
      ${board(5)}
      ${recap}
    </div>`,
    `<div class="flex flex--col flex--center-x flex--top gap--medium stretch-x h--full">
      ${portrait(4, 4)}
      ${memorialText(false)}
      <div class="grow"></div>
      ${qr(2, 4)}
    </div>`,
  ),
)

const halfHorizontal = oriented(
  'layout layout--row layout--left layout--stretch-y gap--medium',
  ready(
    `${portrait(2, 3)}
    <div class="flex flex--col flex--left gap--xsmall grow w--min-0 h--full">
      ${nameLine()}
      ${statusLine(1)}
      {% if attention %}${attention(1)}{% else %}${prompt(2)}{% endif %}
      ${lines(2, 1)}
    </div>
    ${qr(2, 4)}`,
    `${portrait(2, 3)}${memorialText(true)}${qr(2, 4)}`,
    true,
  ),
  ready(
    `<div class="flex flex--col flex--left gap--xsmall grow w--min-0 h--full">
      <div class="flex flex--row flex--left flex--top gap--small stretch-x">${portrait(1, 2)}<div class="flex flex--col flex--left gap--xsmall grow w--min-0">${nameLine()}${statusLine(2)}</div>${qr(2, 4)}</div>
      {% if attention %}${attention(2)}{% else %}${prompt(2)}{% endif %}
      ${lines(2, 2)}
    </div>`,
    `<div class="flex flex--row flex--left flex--top gap--small stretch-x">${portrait(1, 2)}${memorialText(true)}${qr(2, 4)}</div>`,
  ),
)

const halfVertical = oriented(
  'layout layout--col layout--top layout--stretch-x gap--small',
  ready(
    `${nameLine()}
    <div class="no-shrink flex flex--row flex--between flex--top stretch-x">${portrait(2, 3)}${qr(2, 4)}</div>
    ${statusLine(1)}
    {% if attention %}${attention(2)}{% else %}${prompt(3)}{% endif %}
    ${lines(3, 2)}`,
    `<div class="no-shrink flex flex--row flex--between flex--top stretch-x">${portrait(2, 3)}${qr(2, 4)}</div>${memorialText(false)}`,
  ),
  ready(
    `${nameLine()}
    ${portrait(2, 3)}
    ${statusLine(2)}
    {% if attention %}${attention(3)}{% else %}${prompt(3)}{% endif %}
    ${lines(3, 3, 'description')}
    <div class="grow"></div>
    <div class="no-shrink flex flex--row flex--center-x stretch-x">${qr(2, 4)}</div>`,
    `${portrait(2, 3)}${memorialText(true)}<div class="grow"></div><div class="no-shrink flex flex--row flex--center-x stretch-x">${qr(2, 4)}</div>`,
  ),
  true,
)

const quadrant = oriented(
  'layout layout--col layout--top layout--stretch-x gap--small',
  ready(
    `<div class="no-shrink flex flex--row flex--top gap--small stretch-x">
      <div class="flex flex--col flex--left gap--xsmall grow w--min-0">${nameLine()}${statusLine(2)}</div>
      ${qr(2, 4)}
    </div>
    {% if attention %}${attention(2)}{% elsif decision %}${prompt(2)}{% else %}${lines(1, 2)}{% endif %}`,
    `<div class="no-shrink flex flex--row flex--top gap--small stretch-x">${memorialText(true)}${qr(2, 4)}</div>`,
    true,
  ),
  ready(
    `${nameLine()}
    ${statusLine(1)}
    {% if attention %}${attention(3)}{% elsif decision %}${prompt(3)}{% else %}${lines(2, 3, 'description')}{% endif %}
    <div class="grow"></div>
    <div class="no-shrink flex flex--row flex--center-x stretch-x">${qr(2, 4)}</div>`,
    `${memorialText(true)}<div class="grow"></div><div class="no-shrink flex flex--row flex--center-x stretch-x">${qr(2, 4)}</div>`,
    true,
  ),
  true,
)

export const screenMarkup = {
  markup: full,
  markup_half_horizontal: halfHorizontal,
  markup_half_vertical: halfVertical,
  markup_quadrant: quadrant,
} as const
