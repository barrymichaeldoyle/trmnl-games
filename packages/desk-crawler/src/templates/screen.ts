/**
 * Template v65 inverts the goal row and points to the companion while a reached goal's reward waits (D184).
 * Template v64 gives the full landscape ledger the portrait's adaptive rows: changes packed at their natural width and
 * the newest story on one line with its changes and time whenever they fit (D183).
 * Template v60 gives full portrait a screen-wide ledger followed by goal/tasks on the left and a compact board on
 * the right on X. Its five-row window keeps the hero visible; the OG retains its compact two-column board.
 * Four self-contained TRMNL layouts. Template v59 bounds stories to their allocated column and the board below, and refits after fonts settle. Template v58 makes a full bag the whole view on every layout, with the largest bag code, the slot count and a held find (D171). Template v57 reads its own words from the payload's `labels`, in the owner's
 * language (D169). Template v56 draws each story's changes behind its HUD mark, like the recap ("+14"
 * behind the letters XP), without "No effect", and puts changes in words under the story on the X portrait ledger (D165). Template v55 shows a dug-in elite in the attention slot of every layout: its name,
 * ten HP ticks and the share left, and in the full layouts when it leaves (D163). Template v54 makes the OG quarter say a pause, a knockout's return time or a set
 * wake time, keeps the level beside a long name, gives its stories the width the QR column did not use, and shows the
 * standing code at 2x in the OG portrait quarter; the X portrait quarter gains the status line (D160). Template v53 gives the X full landscape today's to-do tasks at the head of its
 * board column, the board fitted to what is left, and the current goal pinned under the stories (D138). Template v51 removes the desk drawer (D123): the bag count is "20/20" again and the
 * drawer glyph is gone. Template v50 adds the to-do list (D112): a checkbox glyph for tasks ticked off and
 * the morning stand-up, a "2 tasks" recap fact, and a stand-up (or several tasks ticked off) that says its count where a
 * row is too narrow for the labels. Template v49 added the desk drawer (D111): the bag count gained "+N" while the drawer
 * held gear, and a find that went in the drawer took a drawer glyph. Template v48 adds the raid glyph (a burglar's mask) for raid stories and the recap's
 * raid fact, and widens the ledger's gold column from 78 to 92 pixels so a raid's four-digit gold swing fits (D110). Template v47 moves the OG full landscape's code into the view's corner as a smaller
 * corner-cut code to the `/dc` short link, and runs the gear line on under it (D108). Template v46 closes the X half's details column to small gaps, so its board keeps a
 * third row above the recap ribbon (D104). Template v45 moves the X side landscape's code to the header's top-right corner,
 * names its gear by the attack and defense marks, shows four board rows and sets the recap as a ribbon at the foot,
 * as the X quarter landscape now does too (D104).
 * Template v44 shows the stance beside the bag count under a gauge mark (D103).
 * Template v43 stands the rune rule on end between the X landscape half's columns
 * and puts a thin rule under its scene (D97). Template v42 sets the X landscape half's scene at 3x (D97). Template v41 rearranges the X's landscape half (D97): a details column (hero, HUD,
 * gear on two lines, board) beside a vertical rule, then the scene and code over the rune rule and the ledger. Template v40 gives the X its own half, side and quarter arrangements (D95): the
 * half views take the full layout's header, scene, board and one-line ledger; the side stacks the header over the scene
 * (its bag code hung in the corner in landscape), the stories and a board; the quarter shows the HP and XP counts with
 * the code beside the name. The OG keeps its arrangements, each block marked `lg:hidden`. Template v39 lifts the OG-sized panels (D94): the full landscape sets a 3x scene
 * beside a five-row board and runs a screen-wide ledger of one-line stories with stat columns; the full portrait takes
 * the 3x scene across its width with the QR hung in its corner and a six-row board in two columns; both name the
 * counters and show the gear by its marks. On BWRY ink panels the scene prints its four-ink twin and the hearts, lost
 * HP, found gold, the own rank row, the celebration badge and attention lines take red and yellow. Template v38 reworks the full portrait: the landscape's header (the HUD block
 * beside the hero on the X, under it on the OG), the scene across the full width with the standing QR hung in its
 * corner, and a captioned rule between the stories and the ranking; the celebration badge keeps its size in stretching
 * columns. Template v37 polishes the X's full layout: each story is one line, its XP, gold
 * and HP in fixed columns before the time; the stories and the ranking get a wider gutter and a full-width rune; the
 * ranking shows up to ten ruled rows (`top10`), in two columns in portrait. Template v36 reworks the full layout: attack and defense beside the name, the bag
 * count beside the potions, a small companion QR in the top-right corner, a bag-full panel over the stories, and wider
 * stories without the bag column; the recap's facts sit further apart everywhere. v35 draws the recap as icon-led
 * facts under its name and hours. v34 adds the merchant notice (an inverted line in the attention slot that
 * keeps the stories). v33 completes the HUD: XP as ten
 * half-step ticks under the hearts with the numbers at the end, attack and
 * defense marks in the counter line, a shorter full header so the scene and
 * stories move up, and a leaderboard that marks the hero's own row instead of
 * repeating the rank (v32: hearts, counters and chips; v31: centred setup
 * panel; v30: portrait arrangements; v29: a companion QR in every view).
 * User text arrives only through escaped merge_variables; scenes and QR codes
 * use existing integer-scaled artwork. No shared-template registration.
 */
import { GLYPHS, glyphRows } from '../art/glyphs'
import { hudMarkUri } from '../art/hud'
import { DEVICE_WORDS, type DeviceWords } from '../i18n/device'

export const TEMPLATE_VERSION = 66

/**
 * D169: one of the template's own words, from the payload's `labels` in the owner's language. The English default keeps
 * a template that meets an older payload (web and backend deploy apart) reading as before.
 */
const L = (key: keyof DeviceWords['labels']) => `{{ labels.${key} | default: "${DEVICE_WORDS.en.labels[key]}" }}`

const svgDataUri = (svg: string) => `data:image/svg+xml;base64,${btoa(svg)}`

/** Title-bar icon: an upright letter-opener blade with a spark. Inline, so it never needs the network. */
const TITLE_ICON = svgDataUri(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="square">' +
    '<path d="M12 2v13"/><path d="M8 15h8"/><path d="M12 15v4"/><path d="M10 21h4"/>' +
    '<path d="M19 4v4M17 6h4"/><path d="M5 9v2M4 10h2"/></svg>',
)

/**
 * Rune divider between the scene and the story: a thin rule with a diamond and runic ticks, drawn at the width of its
 * column so the OG keeps whole pixels instead of scaling the image down.
 */
const runeDivider = (width: number) => {
  const c = width / 2
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="12" viewBox="0 0 ${width} 12" fill="black">` +
      `<rect x="0" y="5" width="${c - 30}" height="2"/><rect x="${c + 30}" y="5" width="${c - 30}" height="2"/>` +
      `<path d="M${c} 0l6 6-6 6-6-6z"/><rect x="${c - 20}" y="2" width="2" height="8"/><rect x="${c + 18}" y="2" width="2" height="8"/>` +
      `<rect x="${c - 38}" y="3" width="2" height="6"/><rect x="${c + 36}" y="3" width="2" height="6"/></svg>`,
  )
}
/** The ornament alone: its rule stubs meet the fills on either side. */
const RUNE_ORNAMENT = runeDivider(120)
/**
 * D181: the framework repaints `image--adaptive` marks in the theme's ink (white under TRMNL's Dark theme), where
 * black-on-clear art would vanish. Every 1-bit mark carries it; scenes, codes and the red ink-panel hearts do not.
 */
const ADAPTIVE = 'image--adaptive'
/**
 * Every piece of the rule is sized by the framework's pixel classes, which the X scales up, so fills and ornament
 * always join at one weight (D92). `ruleFill` stretches as a 2-unit bar in the theme's black (an adaptive image keeps
 * its proportions, so a stretched one could not follow the theme); the ornament keeps its shape.
 */
const ruleFill = `<div class="grow w--min-0 h--[2px] bg--black"></div>`
const runeRule = `${ruleFill}<img class="no-shrink w--[120px] h--[12px] ${ADAPTIVE}" src="${RUNE_ORNAMENT}" alt="">${ruleFill}`

/**
 * The rune rule stood on end, for the X landscape half's column separator (D97): the same ornament and fill transposed,
 * the fills stretching to the column's height.
 */
const RUNE_ORNAMENT_V = svgDataUri(atob(RUNE_ORNAMENT.split(',')[1]!).replace('width="120" height="12" viewBox="0 0 120 12" fill="black">', 'width="12" height="120" viewBox="0 0 12 120" fill="black"><g transform="matrix(0 1 1 0 0 0)">').replace('</svg>', '</g></svg>'))
const ruleFillV = `<div class="grow h--min-0 w--[2px] bg--black"></div>`
const runeRuleV = `<div class="no-shrink flex flex--col flex--center-x gap--none" data-rune-rule="vertical">${ruleFillV}<img class="no-shrink w--[12px] h--[120px] ${ADAPTIVE}" src="${RUNE_ORNAMENT_V}" alt="">${ruleFillV}</div>`

/**
 * Device-envelope-only code: no code in owner/public preview payloads. Fits the existing footer height. "code" tells a
 * passer-by it is something to enter; the narrow portrait bars drop the word to fit.
 */
const KEEPSAKE_WORD = `<span data-keepsake-word="true">${L('keepsake_word')}</span>`
const keepsakeFooter = `{% if desk_keepsake_code %}<span class="instance">${L('keepsake')}${KEEPSAKE_WORD} {{ desk_keepsake_code | escape }}</span>{% endif %}`

const titleBar = `
<div class="title_bar">
  <img class="image image-stroke ${ADAPTIVE}" src="${TITLE_ICON}" alt="">
  <span class="title">Desk Crawler</span>
  ${keepsakeFooter}
</div>`

/**
 * Narrow portrait columns (side, quarter): a 480-pixel-wide panel can't fit the name beside the code, so while a code
 * is showing it takes the name's place there; the icon still marks the plugin. The X keeps both. Both use the short label.
 */
const titleBarNarrow = titleBar
  .replace('<span class="title">', '<span class="title{% if desk_keepsake_code %} hidden lg:inline-block{% endif %}">')
  .replace(KEEPSAKE_WORD, '')


type SceneField = 'scene_url' | 'scene_url_small' | 'scene_url_medium'
/**
 * Grayscale tiers carry a bit-depth class and ink panels a palette class instead, so `1bit:`/`2bit:`/`4bit:` variants
 * reach every panel except the ink ones (D94). `inkOnly` shows an element on ink panels alone; `ink` paints red or
 * yellow there and keeps black (or white) everywhere else.
 */
const inkOnly = '1bit:hidden 2bit:hidden 4bit:hidden'
const ink = (property: 'text' | 'bg', colour: 'red' | 'yellow', fallback = 'black') =>
  `${property}--${colour} 1bit:${property}--${fallback} 2bit:${property}--${fallback} 4bit:${property}--${fallback}`
/**
 * A scene image below the X's breakpoint: the 1-bit art on every grayscale tier, and on ink panels its four-ink twin
 * (the same path with `-bwry`, D94), where the hero's cardigan and the monsters print in red and yellow and the paper
 * shows through. The wrapper carries the breakpoint so the bit-depth classes never meet `lg:` ones on one element, and
 * lays the image out as a flex item that may shrink, so a narrow column fits it to its width as before the wrapper.
 */
const grayOnly = 'hidden 1bit:block 2bit:block 4bit:block'
const sceneImage = (field: SceneField, classes = 'lg:hidden') =>
  `<div class="${classes} flex w--min-0"><img class="image ${grayOnly}" src="{{ ${field} }}" alt=""><img class="image ${inkOnly}" src="{{ ${field} | replace: ".png", "-bwry.png" }}" alt=""></div>`
/** Base scene everywhere, swapped for an integer-scaled larger image on screen--lg (TRMNL X). */
const scene = (field: SceneField, large = field === 'scene_url' ? 'scene_url_large' : 'scene_url_medium', hideXWhenBag = false) => {
  const xArt = hideXWhenBag ? `{% if qr_base == "" %}<img class="image hidden lg:block" src="{{ ${large} }}" alt="">{% endif %}` : `<img class="image hidden lg:block" src="{{ ${large} }}" alt="">`
  return `
  {% if ${field} != "" %}<div class="flex flex--row flex--center-x stretch-x" data-scene-art="true">${sceneImage(field)}${xArt}</div>{% endif %}`
}

/** The rune rule across the full width of its column. */
const divider = `
  <div class="flex flex--row flex--center-y gap--none stretch-x" data-rune-rule="true">${runeRule}</div>`

/**
 * D180: while a weekly keepsake waits and no urgent code is up, every standing code (the bag link, the home link and the
 * OG's corner code) opens the keepsake's claim link instead, at the same size, and captions that name a code show it.
 * A hidden title bar then still leaves a way to the keepsake. Older envelopes without the field keep their codes.
 */
const KEEPSAKE_ASSIGNS = `{% assign keepsake_waiting = false %}{% if qr_base == "" and keepsake_qr_base and keepsake_qr_base != "" and desk_keepsake_code %}{% assign keepsake_waiting = true %}{% if companion_qr_base != "" %}{% assign companion_qr_base = keepsake_qr_base %}{% endif %}{% if home_qr_base != "" %}{% assign home_qr_base = keepsake_qr_base %}{% endif %}{% if corner_qr_base != "" %}{% assign corner_qr_base = keepsake_corner_qr_base %}{% endif %}{% endif %}`
/** The waiting keepsake's code under its QR, in place of the standing code's caption. */
// D194: `.label` lays out as flex, which drops an ordinary space between the label and the code's box, so there it is a
// non-breaking one; a title caption keeps the ordinary space, where the code can wrap under a long label.
const keepsakeCaption = (classes: string) => `<span class="${classes} text--bold" data-keepsake-caption="true">${L('keepsake')}${classes.split(' ').includes('label') ? '&nbsp;' : ' '}<span class="inline-block">{{ desk_keepsake_code | escape }}</span></span>`

/**
 * HUD marks assigned once per layout (`hud_heart_full`...). Drawn at twice their grid so the X, where the framework
 * scales pixel classes up, keeps whole pixels; the classes size them on the OG.
 */
const HUD_ASSIGNS =
  `{% assign hud_heart_full = "${hudMarkUri('heartFull', 36, 32)}" %}{% assign hud_heart_half = "${hudMarkUri('heartHalf', 36, 32)}" %}{% assign hud_heart_empty = "${hudMarkUri('heartEmpty', 36, 32)}" %}` +
 `{% assign hud_heart_full_ink = "${hudMarkUri('heartFull', 36, 32, '#ff0000')}" %}{% assign hud_heart_half_ink = "${hudMarkUri('heartHalf', 36, 32, '#ff0000')}" %}{% assign hud_heart_empty_ink = "${hudMarkUri('heartEmpty', 36, 32, '#ff0000')}" %}` +
  `{% assign hud_tick_full = "${hudMarkUri('tickFull', 36, 16)}" %}{% assign hud_tick_half = "${hudMarkUri('tickHalf', 36, 16)}" %}{% assign hud_tick_empty = "${hudMarkUri('tickEmpty', 36, 16)}" %}` +
  `{% assign hud_sword = "${hudMarkUri('sword', 24, 24)}" %}{% assign hud_shield = "${hudMarkUri('shield', 24, 24)}" %}` +
  `{% assign hud_coin = "${hudMarkUri('coin', 24, 24)}" %}{% assign hud_potion = "${hudMarkUri('potion', 24, 24)}" %}{% assign hud_xp = "${hudMarkUri('xp', 48, 32)}" %}{% assign hud_bag = "${hudMarkUri('bag', 24, 24)}" %}` +
  `{% assign hud_stance_cautious = "${hudMarkUri('stanceCautious', 24, 24)}" %}{% assign hud_stance_balanced = "${hudMarkUri('stanceBalanced', 24, 24)}" %}{% assign hud_stance_bold = "${hudMarkUri('stanceBold', 24, 24)}" %}`

/**
 * A HUD row: marks and counts that wrap where a column is too narrow for all of them. It never shrinks, so beside a
 * long hero name (the quarter header) the name clamps instead of the hearts sliding past the panel edge.
 */
const hudRow = (data: string, inner: string, gap = 'gap--small') => `<div class="flex flex--row flex--wrap flex--left flex--center-y ${gap} no-shrink" ${data}>${inner}</div>`

/**
 * One count with its HUD mark instead of a word: the marks name each count, as in the companion's HUD. The mark sits
 * three pixels from its number and counts sit a medium gap apart (`COUNTER_GAP`), so each number reads as its own
 * mark's rather than the next one's.
 */
const COUNTER_ICON = `w--[16px] h--[16px] no-shrink ${ADAPTIVE}`
const COUNTER_GAP = 'gap--medium'
const counter = (icon: string, text: string, classes = '') => `<div class="${classes}flex flex--row flex--center-y gap--[3px] no-shrink"><img class="${COUNTER_ICON}" src="{{ ${icon} }}" alt=""><span class="label lg:title--small">${text}</span></div>`
/** Attack and defense (the companion's ATK/DEF, D60): the level base plus the equipped gear. */
const attackDefense = (classes = '') => counter('hud_sword', '{{ attack }}', classes) + counter('hud_shield', '{{ defense }}', classes)
/** Bag slots in use, always beside the potions (D88). Null (unlinked) shows nothing. */
const bagCount = (classes = '') => `{% if bag_capacity %}${counter('hud_bag', '{{ bag_used }}/{{ bag_capacity }}', classes).replace('<div class="', '<div data-bag-count="true" class="')}{% endif %}`
/**
 * The stance under its gauge mark, needle low, centred or high (D103), after the bag count. A setting rather than a
 * count, it outlasts the log line that changed it. Empty (unlinked, or a catalog without stances) shows nothing.
 */
const stanceCount = (classes = '') =>
  `{% if stance_name and stance_name != "" %}{% case stance %}{% when "cautious" %}{% assign hud_stance = hud_stance_cautious %}{% when "bold" %}{% assign hud_stance = hud_stance_bold %}{% else %}{% assign hud_stance = hud_stance_balanced %}{% endcase %}` +
  `${counter('hud_stance', '{{ stance_name | escape }}', classes).replace('<div class="', '<div data-stance="{{ stance | escape }}" class="')}{% endif %}`
const goldPotions = (classes = '') => counter('hud_coin', '{{ gold }}', classes) + counter('hud_potion', '{{ potions }}', classes)
/**
 * Gold, potions, bag slots and the stance under the hero in the full layouts (D88, D103), each count named: the OG's full header has the
 * width for the words too. `lg:flex` keeps the X's wider default gap.
 */
const heroCounters =
  hudRow('data-counters="words"', counter('hud_coin', `{{ gold }} ${L('gold')}`) + counter('hud_potion', `{{ potions }} {% if potions == 1 %}${L('potion')}{% else %}${L('potions')}{% endif %}`) + bagCount() + stanceCount(), COUNTER_GAP).replace('class="flex', 'class="flex lg:flex')

/**
 * The full layouts' name line (D88): the hero and level, then the attack and defense marks. On the OG a long name
 * clamps rather than pushing the marks off the line; the X has room for the longest (16-character) name, so it never
 * clamps there. The landscape header sizes the hero column to its content (D90) and sets the HUD block against the
 * corner QR, so the spare width sits between the two and goes to the hero column first, a little below the top
 * (`pt--2`; centring it in the QR's height sat too low) (D91).
 */
const nameRow = (names: string) =>
  `<div class="flex flex--row flex--left flex--center-y gap--small stretch-x" data-name-row="true">${names}` +
  `<div class="flex flex--row flex--center-y ${COUNTER_GAP} no-shrink" data-attack-defense="true">${attackDefense()}</div></div>`

/**
 * Health as ten half-heart hearts, the companion's HUD meter (D60): each half fills independently, so the row reads in
 * 5% steps. Rounded from the real numbers, and never empty while the hero has any health. Wide rows carry the count
 * and the attack and defense marks after it (`extra`); narrow columns show the count in the counter rows instead,
 * since ten hearts already fill their width.
 */
const HEART_CLASSES = 'w--[18px] h--[16px] no-shrink'
const hpCount = `<span class="label lg:title--small no-shrink" data-hp-count="true">{{ hp }}/{{ max_hp }} ${L('hp')}</span>`
const hearts = (count = true, extra = '') =>
  `{% if max_hp > 0 %}{% assign heart_halves = max_hp | divided_by: 2 | floor %}{% assign heart_halves = hp | default: 0 | times: 20 | plus: heart_halves | divided_by: max_hp | floor %}{% else %}{% assign heart_halves = 0 %}{% endif %}{% if hp > 0 and heart_halves < 1 %}{% assign heart_halves = 1 %}{% endif %}` +
  hudRow(`data-hearts="{{ heart_halves }}"`, `${heartRow('', grayOnly)}${heartRow('_ink', inkOnly)}${count ? hpCount : ''}${extra}`)
/**
 * One row of the ten hearts: black on grayscale tiers, red on ink panels (`_ink` marks, D94). The visibility sits on a
 * wrapper, since the bit-depth `flex` variants bring the framework's default gap with them.
 */
const heartRow = (suffix: string, visibility: string) =>
  `<div class="${visibility} no-shrink"><div class="flex flex--row gap--[2px] no-shrink">{% for i in (1..10) %}{% assign heart_right = i | times: 2 %}{% assign heart_left = heart_right | minus: 1 %}<img class="${HEART_CLASSES}${suffix ? '' : ` ${ADAPTIVE}`}" src="{% if heart_halves >= heart_right %}{{ hud_heart_full${suffix} }}{% elsif heart_halves >= heart_left %}{{ hud_heart_half${suffix} }}{% else %}{{ hud_heart_empty${suffix} }}{% endif %}" alt="">{% endfor %}</div></div>`

/**
 * XP as ten half-step ticks the width of the hearts, the thin bar directly under them with the numbers at the end
 * (D74): the same 5% steps and the same floor as the hearts, so liquidjs and Ruby Liquid agree. Wide rows add the
 * coin and potion counts after the numbers (`extra`); the 240-pixel portrait columns wrap the numbers under the ticks.
 */
const TICK_CLASSES = `w--[18px] h--[8px] no-shrink ${ADAPTIVE}`
const xpCount = '<span class="label lg:title--small no-shrink" data-xp-count="true">{{ xp }}/{{ xp_to_next }} XP</span>'
/** `extra` counters (the portrait's gold, potions and bag) follow the XP count at the counter gap. */
const xpTicks = (extra = '') =>
  `{% assign xp_halves = xp_pct | default: 0 | times: 20 | plus: 50 | divided_by: 100 | floor %}` +
  hudRow(`data-xp-ticks="{{ xp_halves }}"`, `<div class="flex flex--row gap--[2px] no-shrink">{% for i in (1..10) %}{% assign tick_right = i | times: 2 %}{% assign tick_left = tick_right | minus: 1 %}<img class="${TICK_CLASSES}" src="{% if xp_halves >= tick_right %}{{ hud_tick_full }}{% elsif xp_halves >= tick_left %}{{ hud_tick_half }}{% else %}{{ hud_tick_empty }}{% endif %}" alt="">{% endfor %}</div>${extra ? `<div class="flex flex--row flex--wrap flex--left flex--center-y ${COUNTER_GAP} no-shrink" data-xp-counters="true">${xpCount}${extra}</div>` : xpCount}`)

/**
 * The wide HUD (full landscape and portrait): hearts and the HP count on one row; XP ticks and count on the next
 * (attack and defense sit in the name row, D88). The portrait adds coins, potions and bag slots after the XP; the
 * landscape keeps them under the hero (`heroCounters`).
 */
const hudWide = (withCounters: boolean) => `${hearts(true)}
    ${xpTicks(withCounters ? goldPotions() + bagCount() : '')}`

/**
 * Narrow columns (side, half, their portrait forms): the hearts alone fill the width, so the HP count leads a combat
 * row with attack and defense (a full heart marks it), and coins and potions take a row of their own.
 */
const counters = () => `${hudRow('data-counters="true"', counter('hud_heart_full', '{{ hp }}/{{ max_hp }}') + attackDefense(), COUNTER_GAP)}${hudRow('data-counters="2"', goldPotions() + bagCount() + stanceCount(), COUNTER_GAP)}`

/** One glyph as a compact URL-encoded SVG: a single path of horizontal runs keeps each icon to a few hundred bytes. */
export const glyphUri = (kind: string, size: number) => {
  const runs = glyphRows(kind).flatMap((row, y) => [...row.matchAll(/#+/g)].map((run) => `M${run.index} ${y}h${run[0].length}v1h-${run[0].length}z`))
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 8 8' shape-rendering='crispEdges'><path d='${runs.join('')}'/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * The companion's open-task box (D112) never appears on the device, so it costs no markup there. The meeting mug (D141)
 * and the lost-property badge (D145) are left out too, so both shipped without a template change: the device draws
 * them with the system glyph.
 */
const GLYPH_KINDS = Object.keys(GLYPHS).filter((kind) => kind !== 'todoOpen' && kind !== 'meeting' && kind !== 'lost_property')

/** Each glyph assigned once per layout (`glyph16_combat`...), so log lines only pick a variable instead of repeating the SVG. */
const glyphAssigns = (sizes: readonly number[]) =>
  sizes.flatMap((size) => GLYPH_KINDS.map((k) => `{% assign glyph${size}_${k} = "${glyphUri(k, size)}" %}`)).join('')

/** The log-kind glyph for a Liquid expression, the same icons as the companion log. Needs `glyphAssigns` for `size`. */
const logIcon = (kind: string, size: number) =>
  `{% case ${kind} %}${GLYPH_KINDS.filter((k) => k !== 'system')
    .map((k) => `{% when "${k}" %}{% assign glyph = glyph${size}_${k} %}`)
    .join('')}{% else %}{% assign glyph = glyph${size}_system %}{% endcase %}<img class="image no-shrink ${ADAPTIVE}" src="{{ glyph }}" alt="">`

/**
 * Stored text with names in [[bold marks]]: escaped first, then each mark becomes an atomic inline `text--bold` span (plain <b> loses to
 * the X fonts' fixed weight axis). Older text has no marks.
 */
const rich = (expr: string) => `{{ ${expr} | escape | replace: "[[", '<span class="text--bold inline-block">' | replace: "]]", "</span>" }}`

/**
 * Rich text in one regular-weight span: `.label` is inline-flex and would lay out each run as its own item, and label
 * text is already semibold on the X, so names only stand out against regular weight. The OG's small bitmap font has a
 * single weight, so there names are bold only in the larger newest-story line.
 */
const richSpan = (content: string) => `<span class="text--regular">${content}</span>`

/**
 * Story above its metadata; the icon and time start at the same left edge. A to-do line in its count form (D112)
 * keeps its full labels on the X, which wraps rather than clamps.
 */
const storyText = richSpan(`{% if line_full %}<span class="lg:hidden">${rich('line_story')}</span><span class="hidden lg:inline-block">${rich('line_full')}</span>{% else %}${rich('line_story')}{% endif %}`)

/** Status with a real time when it has one ("Knocked out, back at 12:30"); otherwise the self-contained label. */
const statusText = richSpan(`{% if status_eta_at and utc_offset != nil %}${rich('status_eta_label')} {{ status_eta_at | plus: utc_offset | date: "%H:%M" }}{% else %}${rich('status_label')}{% endif %}`)

/**
 * Clamp attributes that keep bold names where possible. The framework clamp replaces an element's markup with plain
 * text, so text whose visible length (`plain`) fits in `fit` characters is left unclamped on the OG, and the X (wide,
 * with room to wrap) never clamps rich text. Only longer OG text falls back to a plain clamped line.
 */
const fitClamp = (plain: string, clamp: number, fit: number) =>
  `data-clamp="{% if ${plain}.size > ${fit} %}${clamp}{% else %}0{% endif %}" data-clamp-lg="0"`

const plainOf = (expr: string) => `${expr} | replace: "[[", "" | replace: "]]", ""`

/** On ink panels a lost HP reads red and found gold sits on yellow (D94); units follow a no-break space. */
const chipInk = (text: string) => `{% if ${text} contains "\u00a0HP" and ${text} contains "−" %} ${ink('text', 'red')}{% elsif ${text} contains "\u00a0gold" and ${text} contains "+" %} ${ink('bg', 'yellow', 'white')}{% endif %}`
/**
 * One change drawn like a recap fact: its HUD mark and the number ("+14" behind the letters XP), so a row reads at a glance
 * without "XP", "gold" and "HP" spelled out on every line. Units arrive after a no-break space; a change with no mark
 * ("Pouch holds 4", an effect) stays as its words.
 */
const chip = (text: string) =>
  `{% assign change_parts = ${text} | split: "\u00a0" %}{% assign change_unit = change_parts | last %}{% assign change_icon = "" %}{% assign change_size = "${COUNTER_ICON}" %}{% assign change_text = ${text} %}` +
  `{% if change_parts.size > 1 %}{% case change_unit %}{% when "XP" %}{% assign change_icon = hud_xp %}{% assign change_size = "w--[24px] h--[16px] no-shrink ${ADAPTIVE}" %}{% when "gold" %}{% assign change_icon = hud_coin %}{% when "HP" %}{% assign change_icon = hud_heart_full %}{% assign change_size = "w--[18px] h--[16px] no-shrink ${ADAPTIVE}" %}{% when "bag slot", "bag slots" %}{% assign change_icon = hud_bag %}{% endcase %}` +
  `{% if change_unit contains "potion" %}{% assign change_icon = hud_potion %}{% endif %}` +
  `{% if change_icon != "" %}{% assign change_text = change_parts | first %}{% if change_unit == "HP from potion" %}{% assign change_text = change_text | append: "\u00a0HP" %}{% endif %}{% endif %}{% endif %}` +
  `<span class="flex flex--row flex--center-y gap--[3px] no-shrink" data-change="true">{% if change_icon != "" %}<img class="{{ change_size }}" src="{{ change_icon }}" alt="">{% endif %}<span class="label lg:title--small${chipInk(text)}">{{ change_text | escape }}</span></span>`
/**
 * A fixed-width cell, its mark at the left, so the same stat sits in the same place on every line. A device text scale
 * grows the numbers but not pixel widths, so the fitter widens a column's cells together past `px` when they overflow.
 */
const chipCell = (field: string, kind: string, px: number) => `<span class="flex flex--row flex--left no-shrink w--[${px}px]" data-chip-cell="${kind}" data-chip-width="${px}">{% if ${field} != "" %}${chip(field)}{% endif %}</span>`
/**
 * The X full layouts' changes on the story's line (D89): XP, gold and HP each in their own fixed column before the
 * time, so their marks line up down the ledger, and any other marked change (potions, bag slots) just before them.
 * A change with no mark ("Pouch holds 4", an effect) joins them, or takes a line under the story where `others` is
 * false. A story without changes keeps the whole line, and one with only other changes reserves no stat columns.
 * Units arrive joined by a no-break space, so the words after it name the stat.
 */
const chipSort = `{% assign chip_xp = "" %}{% assign chip_gold = "" %}{% assign chip_hp = "" %}{% assign chip_marked = "" %}{% assign chip_words = "" %}{% for change in line_changes %}{% assign chip_unit = change | split: "\u00a0" | last %}{% if chip_unit == "XP" %}{% assign chip_xp = change %}{% elsif chip_unit == "gold" %}{% assign chip_gold = change %}{% elsif chip_unit == "HP" %}{% assign chip_hp = change %}{% elsif change contains "\u00a0" and chip_unit contains "potion" or change contains "\u00a0" and chip_unit contains "bag slot" %}{% capture chip_marked %}{{ chip_marked }}${chip('change')}{% endcapture %}{% else %}{% capture chip_words %}{{ chip_words }}${chip('change')}{% endcapture %}{% endif %}{% endfor %}`
const chipColumns = (visibility = 'hidden lg:flex', others = true) => `${chipSort}<span class="${visibility} flex--row flex--center-y flex--right gap--small no-shrink" data-story-chips-inline="true">${others ? '{{ chip_marked }}{{ chip_words }}' : '{% if chip_marked != "" %}<span class="flex flex--row flex--center-y gap--small" data-marked-inline="true">{{ chip_marked }}</span>{% endif %}'}{% if chip_xp != "" or chip_gold != "" or chip_hp != "" %}${chipCell('chip_xp', 'xp', 78)}${chipCell('chip_gold', 'gold', 74)}${chipCell('chip_hp', 'hp', 66)}{% endif %}</span>`

/**
 * One story as a ledger line: the glyph, the story, and its HH:MM at the end of the line; the stat changes follow as
 * outlined chips, one per change, indented to the story's edge. The glyph sits two pixels down so it centres on the
 * letters rather than hugging the rule above the entry. The chips sit in a block so they wrap like words when
 * a narrow column cannot hold them all; the 240-pixel portrait columns put the time there too (`timeBelow`), where the
 * story line has no room for it. A zero-gap grid keeps the chips directly beneath the story. `inline` moves the chips
 * onto the story's own line, right-aligned before the time, so each entry is one line and the chips line up as a
 * column: on the X only (`'lg'`, the full portrait) or everywhere (`'all'`, the full landscape, whose OG ledger spans
 * the screen's width). `adaptive` (both full layouts, D183) lets the fitter pack the changes and try the newest story on
 * one line; `ogMeta` adds the OG portrait's metadata row under the story.
 */
type ChipsInline = false | 'lg' | 'all'
const logLine = (entry: string, classes: string, clamp: number, size: number, fit: number, wrapper = 'block', timeBelow = false, inline: ChipsInline = false, leadMeta = false, ogMeta = false, adaptive = ogMeta) => {
  // On the X alone the inline forms swap in with `lg:` classes; everywhere, they replace the stacked forms outright.
  // `lg:flex` brings the framework's default gap and outranks gap classes, so `'all'` pairs it with `flex` to keep the
  // X's spacing exactly as the X-only form draws it.
  const onlyX = (lg: string) => (inline === 'all' ? '' : lg)
  const shown = inline === 'all' ? 'flex lg:flex' : 'hidden lg:flex'
  // A live entry (the travel line, D91) says its time in the story; the column is for when something happened.
  const timeSpan = (extra = '') => `{% if line_timed %}<span class="${extra}label lg:title--small no-shrink${adaptive ? ' pl--2' : ''}" data-story-time="true">{{ ${entry}.u | plus: utc_offset | date: "%H:%M" }}</span>{% endif %}`
  // The newest story in the inline ledgers (`leadMeta`) is larger: it keeps the whole width, and its changes and time
  // take the line below in the same columns as the rows beneath, rather than squeezing it into three lines.
  const lead = inline !== false && leadMeta
  const time = ogMeta ? (lead ? '' : timeSpan('hidden lg:inline-block ')) : lead && inline === 'all' ? '' : timeSpan(lead ? 'lg:hidden ' : '')
  const changes = `{% for change in line_changes %} ${chip('change')}{% endfor %}`
  const hasChanges = `${entry}.d != nil and ${entry}.d != ""`
  const columns = chipColumns(shown)
  // The portrait ledger (`'lg'`) is too narrow for a story, a change in words ("Pouch holds 6") and three stat columns
  // on one line once a device scale enlarges them, so those changes take a line under the story there instead; the
  // fitter moves the potion and bag marks there too when a text scale leaves the story too narrow.
  const othersBelow = inline === 'lg' && !lead
  const lineFit = Math.max(0, fit - (timeBelow || ogMeta ? 0 : 14))
  // D112: on the OG, a to-do line too long for this row's fit says its count instead ("Stand-up: 3 new tasks."), so it
  // never clamps mid-name; `line_full` keeps the labels for the X.
  const compactSwap = `{% assign line_full = nil %}{% if ${entry}.c and line_plain.size > ${lineFit} %}{% assign line_full = line_story %}{% assign line_story = ${entry}.c %}{% assign line_plain = line_story %}{% endif %}`
  const inlineChips = inline && !lead ? `{% if ${hasChanges} %}${othersBelow ? chipColumns(shown, false) : columns}{% endif %}` : ''
  const storySpan = `<span${adaptive ? ' data-adaptive-text="true"' : ''} class="${classes} grow" ${fitClamp('line_plain', clamp, lineFit)}>${storyText}</span>`
  // Sorted before the row opens, so a row with changes under its story aligns to the story's first line, not its middle.
  const sortFirst = othersBelow ? `{% assign chip_words = "" %}{% assign chip_marked = "" %}{% if ${hasChanges} %}${chipSort}{% endif %}` : ''
  const story = othersBelow ? `<div class="grow w--min-0">${storySpan.replace('<span ', '<span data-story-text="true" ')}{% if chip_words != "" or chip_marked != "" %}<div class="hidden{% if chip_words != "" %} lg:flex{% endif %} flex--row flex--wrap flex--left flex--center-y gap--small pt--1" data-story-chips-other="true"{% if chip_words != "" %} data-words="true"{% endif %}>{% if chip_marked != "" %}<span class="hidden flex--row flex--wrap flex--center-y gap--small" data-marked-below="true">{{ chip_marked }}</span>{% endif %}{{ chip_words }}</div>{% endif %}</div>` : storySpan
  const centred = inline && !lead ? (othersBelow ? '{% if chip_words == "" %} lg:flex--center-y{% endif %}' : ` ${onlyX('lg:')}flex--center-y`) : ''
  const leadRow = lead ? `{% if line_timed or ${hasChanges} %}<div class="${shown} flex--row flex--right flex--center-y gap--xsmall" data-story-lead-meta="true">{% if ${hasChanges} %}${columns}{% endif %}${timeSpan()}</div>{% endif %}` : ''
  // OG full portrait keeps event icon, deltas and timestamp on one metadata row below the full-width story.
  const ogMetadata = `<div class="lg:hidden flex flex--row flex--left flex--center-y gap--small pt--1" data-story-meta="og"><div class="no-shrink">${logIcon(`${entry}.k`, 16)}</div><div class="grow w--min-0 flex flex--row flex--wrap flex--left flex--center-y gap--small">${changes}</div>${timeSpan()}</div>`
  const stacked = ogMeta ? ogMetadata : `{% if ${timeBelow ? `line_timed or ${hasChanges}` : hasChanges} %}<div class="${inline ? 'lg:hidden ' : ''}flex flex--row flex--left flex--top gap--xsmall pt--1" data-story-changes="true"><div class="no-shrink w--[${size}px]"></div><div class="grow w--min-0 flex flex--row flex--wrap flex--left flex--center-y gap--small">${timeBelow ? time : ''}${changes}</div></div>{% endif %}`
  return `{% assign line_timed = false %}{% if utc_offset != nil and ${entry}.live != true %}{% assign line_timed = true %}{% endif %}{% assign line_changes = ${entry}.d | default: "" | split: " · " %}{% assign line_story = ${entry}.n | default: ${entry}.s %}{% assign line_plain = ${plainOf('line_story')} %}${compactSwap}<div class="${wrapper} stretch-x"><div class="grid grid--cols-1 gap--none"${adaptive ? ' data-adaptive-story="true"' : ''}>${entry === 'log[0]' ? '' : '{% unless forloop.first %}<div class="border--h-30 stretch-x"></div>{% endunless %}'}${sortFirst}<div class="flex flex--row flex--left flex--top${centred} gap--xsmall"${othersBelow ? ' data-ledger-row="true"' : ''}${adaptive ? ' data-adaptive-main="true"' : ''}><div class="${ogMeta ? 'hidden lg:block ' : ''}no-shrink pt--0.5">${logIcon(`${entry}.k`, size)}</div>${story}${inlineChips}${timeBelow ? '' : time}</div>${inline === 'all' ? '' : stacked}${leadRow}</div></div>`
}

/** The status line, its clamp fitted like log lines. */
const statusLine = (clamp: number, fit: number) =>
  `{% if status_eta_at and utc_offset != nil %}{% assign status_plain = ${plainOf('status_eta_label')} | append: " 00:00" %}{% else %}{% assign status_plain = ${plainOf('status_label')} %}{% endif %}<span class="label lg:title--small" ${fitClamp('status_plain', clamp, fit)}>${statusText}</span>`

/**
 * A big moment (level-up, elite win, jackpot, rare find) gets an inverted badge above the newest story. Its own row keeps
 * it at its text's size where the column stretches its children (the portrait's `flex--stretch-x`).
 */
const celebrationBadge = (classes: string) => `
      {% if celebration %}<div class="no-shrink flex flex--row flex--left" data-celebration="true"><span class="${classes} label--inverted ${ink('bg', 'red')}">{{ celebration | escape }}</span></div>{% endif %}`

/**
 * Whole story/stat pairs; the fitter keeps the longest newest-first prefix that fits. `rowFit` is the plain length the
 * older one-line entries may reach before the OG clamps them; the full landscape's screen-wide ledger allows more.
 */
const storyList = (clamp: number, classes: string, size = 16, fit = 60, timeBelow = false, inline: ChipsInline = false, rowFit = 28, ogMeta = false, adaptive = ogMeta) => `
  <div class="grow stretch-x" data-story-list="true">
    {% for entry in log %}{% unless attention and forloop.index > 1 %}{% if forloop.first %}${logLine('entry', classes, clamp, size, fit, 'block', timeBelow, inline, true, ogMeta, adaptive)}{% else %}${logLine('entry', 'label lg:title--small', 1, 16, rowFit, inline ? `block pt--1 ${inline === 'all' ? '' : 'lg:'}pt--0.5` : 'block pt--1', timeBelow, inline, false, ogMeta, adaptive)}{% endif %}{% endunless %}{% endfor %}
    {% if log.size == 0 %}<span class="label lg:title--small">${L('first_soon')}</span>{% endif %}
  </div>`

/**
 * Pinned framework 3.4 emits its final stats before signalling readiness. Fit the
 * actual rich-text boxes at that point, reserving the footer and following rank
 * line, and trim boards marked `data-fit-rows` to their slot. First, widen any stat column a device text scale has
 * outgrown, by swapping its framework width class; last, if even the newest story has no room, let the board, scene and
 * parts of the header give way. Only classes change; there are no styles, network calls or writes.
 * Scope to this view so another Desk Crawler slot has its own height budget, and
 * to the orientation layout the framework is showing (the other is display: none).
 */
const fitStories = `<script>
(() => {
  const view = document.currentScript.closest('.view');
  if (!view) return;
  // Keep original locations/classes so repeated framework/font fits can try the single-line form afresh.
  const adaptiveStates = new WeakMap();
  const resetAdaptive = root => {
    const state = adaptiveStates.get(root);
    if (!state) return;
    for (const [el, classes] of state.classes) el.className = classes;
    if (state.meta) state.parent.insertBefore(state.meta, state.next && state.next.parentElement === state.parent ? state.next : null);
    adaptiveStates.delete(root);
  };
  const fit = () => {
    const layout = Array.from(view.querySelectorAll('.layout')).find(el => el.getClientRects().length > 0);
    // A player can hide the title bar (TRMNL keeps its space but draws nothing), so the layout alone bounds the fit then.
    const footer = Array.from(view.querySelectorAll('.title_bar')).find(el => el.getClientRects().length > 0);
    const footerTop = footer ? footer.getBoundingClientRect().top : Infinity;
    if (!layout) return;
    view.querySelectorAll('[data-adaptive-story]').forEach(resetAdaptive);
    // Undo the last run's giving way (below) before measuring anything.
    view.querySelectorAll('[data-gave-way]').forEach(el => {
      el.classList.remove('hidden');
      el.dataset.gaveWay.split(' ').filter(Boolean).forEach(cls => el.classList.add(cls));
      delete el.dataset.gaveWay;
    });
    view.querySelectorAll('[data-revealed]').forEach(el => { el.classList.add('hidden'); delete el.dataset.revealed; });
    // Hiding: an element shown by a breakpoint or bit-depth display class drops it too, since that outranks hidden.
    const giveWay = el => {
      const shownBy = Array.from(el.classList).filter(cls => /^(sm|md|lg|1bit|2bit|4bit):(block|flex|inline-block|inline|grid)$/.test(cls));
      shownBy.forEach(cls => el.classList.remove(cls));
      el.classList.add('hidden');
      el.dataset.gaveWay = shownBy.join(' ') || ' ';
    };
    const restore = el => {
      el.classList.remove('hidden');
      el.dataset.gaveWay.split(' ').filter(Boolean).forEach(cls => el.classList.add(cls));
      delete el.dataset.gaveWay;
    };
    // The giving way below is for a device display scale or text size (D165): at the normal scale every layout is
    // fitted by hand, and a narrow slot may leave out its stories on purpose (a recap in their place).
    const screenStyle = getComputedStyle(view);
    const scaled = ['--modifier-scale', '--modifier-text-scale'].some(name => Math.abs((parseFloat(screenStyle.getPropertyValue(name)) || 1) - 1) > 0.01);
    // Width (D165): at a large device scale parts of the header run past the view's edge or under a scannable code.
    // Each part that does takes its narrower form in turn: the hearts and XP ticks leave their counts, attack and
    // defense leave the name row, then the stance, the gear line, the recap's hours and facts, and single counters.
    // If text still sits under the standing code, the code gives way; the urgent one never does.
    const viewBox = view.getBoundingClientRect();
    const codeBoxes = () => Array.from(view.querySelectorAll('[data-companion-qr] img, [data-home-qr] img')).filter(img => img.getClientRects().length > 0).map(img => img.getBoundingClientRect());
    const crowded = (el, codes) => [el, ...el.querySelectorAll('span, img')].some(part => {
      if (!part.getClientRects().length || part.closest('[data-companion-qr], [data-home-qr]')) return false;
      const box = part.getBoundingClientRect();
      if (!box.width || !box.height) return false;
      if (box.right > viewBox.right + 1 || box.left < viewBox.left - 1) return true;
      const marks = part.tagName === 'IMG' || (!part.querySelector('span') && part.innerText.trim() !== '');
      return marks && codes.some(code => box.left < code.right - 1 && box.right > code.left + 1 && box.top < code.bottom - 1 && box.bottom > code.top + 1);
    });
    const narrowings = ['[data-hearts] > div:not([data-hp-count])', '[data-xp-ticks] > div:first-child', '[data-attack-defense]', '[data-stance]', '[data-gear-line]', '[data-recap-span]', '[data-recap-item]', '[data-counters] > *'];
    if (scaled) narrowings.forEach(selector => {
      const codes = codeBoxes();
      view.querySelectorAll(selector).forEach(el => {
        // Recap facts and single counters answer for themselves, other parts for their row; and anything in the header
        // gives way while the HUD column (padded clear of a corner code) runs past the view's edge.
        const own = el.matches('[data-recap-item], [data-counters] > *');
        const row = own ? el : el.closest('[data-hearts], [data-xp-ticks], [data-name-row], [data-counters], [data-recap-items]') || el;
        const hud = Array.from(view.querySelectorAll('[data-hud-block]')).find(block => block.getClientRects().length > 0);
        const hudRight = hud ? Math.max(...[hud, ...hud.querySelectorAll('div, span, img')].filter(part => part.getClientRects().length > 0).map(part => part.getBoundingClientRect().right)) : 0;
        const wide = hudRight > viewBox.right + 1 && !!el.closest('[data-hud-block], [data-hero-header]');
        if (el.getClientRects().length && (wide || crowded(row, codes))) giveWay(el);
      });
    });
    // A name still too wide (the longest names at 1.5x on the OG) swaps for its eight-character form.
    if (scaled) view.querySelectorAll('[data-name-row]').forEach(row => {
      const long = row.querySelector('[data-name-long]');
      const short = row.querySelector('[data-name-short]');
      if (!long || !short || !long.getClientRects().length || !crowded(row, codeBoxes())) return;
      giveWay(long);
      short.classList.remove('hidden');
      short.dataset.revealed = 'true';
    });
    const codes = codeBoxes();
    if (scaled && codes.length && Array.from(view.querySelectorAll('.layout span')).some(span => crowded(span, codes))) {
      view.querySelectorAll('[data-home-qr], [data-companion-qr]:not([data-urgent])').forEach(code => { if (code.getClientRects().length) giveWay(code); });
    }
    // The title bar: a keepsake code the bar truncates takes the title's place, then drops the word "code".
    const instance = footer && footer.querySelector('.instance');
    if (scaled && instance && instance.scrollWidth > instance.clientWidth + 1) {
      const title = footer.querySelector('.title');
      if (title) giveWay(title);
      const word = instance.querySelector('[data-keepsake-word]');
      if (word && instance.scrollWidth > instance.clientWidth + 1) giveWay(word);
    }
    // The full layouts' ledgers use natural-width changes, without empty stat placeholders; other ledgers retain their columns.
    layout.querySelectorAll('[data-adaptive-story] [data-chip-cell]').forEach(cell => {
      Array.from(cell.classList).filter(cls => cls.startsWith('w--[')).forEach(cls => cell.classList.remove(cls));
      cell.classList.toggle('hidden', !cell.querySelector('[data-change]'));
      cell.setAttribute('data-chip-packed', 'true');
    });
    // Stat columns (D165): a text scale grows the numbers but not the cells' pixel widths, so give every cell of a
    // column the framework width class its widest change needs (the classes run to 128 pixels).
    ['xp', 'gold', 'hp'].forEach(kind => {
      const cells = Array.from(view.querySelectorAll('[data-chip-cell="' + kind + '"]')).filter(cell => cell.getClientRects().length > 0 && !cell.hasAttribute('data-chip-packed'));
      if (!cells.length) return;
      const base = Number(cells[0].dataset.chipWidth);
      cells.forEach(cell => { cell.classList.remove('w--[' + cell.dataset.chipFitted + 'px]'); cell.classList.add('w--[' + base + 'px]'); delete cell.dataset.chipFitted; });
      const perPixel = cells[0].getBoundingClientRect().width / base;
      const need = Math.max(...cells.map(cell => cell.firstElementChild ? cell.firstElementChild.getBoundingClientRect().width : 0));
      if (!perPixel || need <= base * perPixel + 0.5) return;
      const fitted = Math.min(128, Math.ceil(need / perPixel) + 1);
      cells.forEach(cell => { cell.classList.remove('w--[' + base + 'px]'); cell.classList.add('w--[' + fitted + 'px]'); cell.dataset.chipFitted = String(fitted); });
    });
    // Portrait ledger rows: where the widened columns leave a story narrower than about 24 ems, its potion and
    // bag marks join the changes in words on the line under it, and the row aligns to its first line.
    view.querySelectorAll('[data-ledger-row]').forEach(row => {
      const inline = row.querySelector('[data-marked-inline]');
      const below = row.querySelector('[data-marked-below]');
      const box = row.querySelector('[data-story-chips-other]');
      const text = row.querySelector('[data-story-text]');
      if (!inline || !below || !box || !text || !row.getClientRects().length) return;
      const words = box.dataset.words === 'true';
      const move = on => {
        inline.classList.toggle('hidden', on); inline.classList.toggle('flex', !on);
        below.classList.toggle('hidden', !on); below.classList.toggle('flex', on);
        if (!words) box.classList.toggle('lg:flex', on);
        row.classList.toggle('lg:flex--center-y', !on && !words);
      };
      move(false);
      if (text.getBoundingClientRect().width < 24 * (parseFloat(getComputedStyle(text).fontSize) || 16)) move(true);
    });
    // Try the whole event on one row using actual glyph, rich-text, change and time boxes at this device/font scale.
    layout.querySelectorAll('[data-adaptive-story]').forEach(root => {
      if (!root.getClientRects().length) return;
      const main = root.querySelector('[data-adaptive-main]');
      const text = root.querySelector('[data-adaptive-text]');
      const og = root.querySelector('[data-story-meta="og"]');
      const x = root.querySelector('[data-story-lead-meta]');
      if (!main || !text) return;
      const small = !!og && og.getClientRects().length > 0;
      const meta = small ? og : x;
      const icon = main.firstElementChild;
      const metaIcon = og && og.firstElementChild;
      const changed = [main, icon, ...(metaIcon ? [metaIcon] : []), ...(meta ? [meta] : [])];
      adaptiveStates.set(root, { classes: changed.map(el => [el, el.className]), meta, parent: meta && meta.parentElement, next: meta && meta.nextSibling });
      if (small) { icon.classList.remove('hidden'); metaIcon.classList.add('hidden'); }
      main.classList.remove('flex--top'); main.classList.add('flex--center-y');
      if (meta) {
        meta.classList.remove('pt--1'); meta.classList.add('no-shrink');
        main.append(meta);
      }
      const range = document.createRange(); range.selectNodeContents(text);
      const boxes = Array.from(range.getClientRects()).filter(box => box.width > 0 && box.height > 0);
      const box = main.getBoundingClientRect();
      const oneLine = boxes.length && Math.max(...boxes.map(r => r.top)) - Math.min(...boxes.map(r => r.top)) <= 2 * (box.width / main.clientWidth || 1);
      const contained = [text, ...main.querySelectorAll('img, [data-change], [data-story-time]')].filter(el => el.getClientRects().length > 0).every(el => {
        const r = el.getBoundingClientRect(); return r.left >= box.left - 0.5 && r.right <= box.right + 0.5;
      });
      const fits = oneLine && contained && main.scrollWidth <= main.clientWidth + 1 && text.scrollWidth <= text.clientWidth + 1;
      if (!fits) resetAdaptive(root);
      root.dataset.storyArrangement = fits ? 'inline' : 'stacked';
    });
    // Recap rows first, since the story budget subtracts their height: drop trailing facts past the row's line cap.
    view.querySelectorAll('[data-recap-items]').forEach(row => {
      if (!row.getClientRects().length) return;
      const items = Array.from(row.querySelectorAll('[data-recap-item]')).filter(item => !item.dataset.gaveWay);
      items.forEach(item => item.classList.remove('hidden'));
      const lines = Number(row.dataset.recapItems) || 1;
      const lineHeight = (items[0] || row.firstElementChild).getBoundingClientRect().height;
      const gap = parseFloat(getComputedStyle(row).rowGap) || 0;
      const limit = lines * lineHeight + (lines - 1) * gap + 0.5;
      let count = items.length;
      while (count > 1 && row.getBoundingClientRect().height > limit) items[--count].classList.add('hidden');
      row.dataset.recapCount = String(count);
      // The most notable fact always stays, even where the name and hours already take the rows on their own.
      row.dataset.recapFit = count === 1 || row.getBoundingClientRect().height <= limit ? 'complete' : 'over';
    });
    const layoutBottom = Math.min(footerTop, viewBox.bottom, layout.getBoundingClientRect().bottom - (parseFloat(getComputedStyle(layout).paddingBottom) || 0));
    // Boards in a bounded slot (the X half's, under its scene): drop trailing rows, and the rule above each, until the
    // board ends inside the slot, keeping the hero's own row.
    view.querySelectorAll('[data-fit-rows]').forEach(board => {
      if (!board.getClientRects().length) return;
      const rows = Array.from(board.querySelectorAll('[data-rank-row]'));
      board.classList.remove('hidden');
      rows.forEach(row => { row.classList.remove('hidden'); if (row.previousElementSibling && row.previousElementSibling.matches('.border--h-30')) row.previousElementSibling.classList.remove('hidden'); });
      const slot = board.closest('[data-fit-bound]');
      const bound = Math.min(layoutBottom, slot ? slot.getBoundingClientRect().bottom : layoutBottom);
      const shown = () => rows.filter(row => !row.classList.contains('hidden'));
      while (shown().length && board.getBoundingClientRect().bottom > bound + 0.5) {
        const visible = shown();
        // The hero's row stays: drop the end farther from it (the bottom on a tie), or the row before an appended hero.
        const own = visible.findIndex(row => row.classList.contains('label--inverted'));
        const appended = own === visible.length - 1 && own > 0 && Number(visible[own].dataset.rankRow) > Number(visible[own - 1].dataset.rankRow) + 1;
        const drop = visible.length < 2 || own < 0 ? visible[visible.length - 1] : appended ? visible[own - 1] : own > visible.length - 1 - own ? visible[0] : visible[visible.length - 1];
        drop.classList.add('hidden');
        const rule = drop.previousElementSibling && drop.previousElementSibling.matches('.border--h-30') ? drop.previousElementSibling : drop.nextElementSibling && drop.nextElementSibling.matches('.border--h-30') ? drop.nextElementSibling : null;
        if (rule) rule.classList.add('hidden');
      }
      // A slot too short for the caption and one row (the longest names wrap the header) shows no board at all. The
      // X-only boards use plain rules, since lg:block would outrank hidden.
      if (!shown().length || board.getBoundingClientRect().bottom > bound + 0.5) board.classList.add('hidden');
      board.dataset.rowCount = String(board.classList.contains('hidden') ? 0 : shown().length);
    });
    const fitLists = () => {
      const starved = [];
      view.querySelectorAll('[data-story-list]').forEach(list => {
        if (!list.getClientRects().length) return;
        const entries = Array.from(list.children).filter(entry => entry.classList.contains('block'));
        entries.forEach(entry => entry.classList.remove('hidden'));
        // A nested h--full ledger can grow past its allocated flex wrapper. Respect every ancestor's
        // slot and the next visible block (especially the side view's leaderboard), not just the ledger.
        let bottom = layoutBottom;
        for (let slot = list; slot && slot !== layout; slot = slot.parentElement) {
          const parent = slot.parentElement;
          const style = getComputedStyle(parent);
          let slotBottom = parent.getBoundingClientRect().bottom - (parseFloat(style.paddingBottom) || 0);
          const gap = parseFloat(style.rowGap) || 0;
          for (let sibling = slot.nextElementSibling; sibling; sibling = sibling.nextElementSibling) {
            const box = sibling.getBoundingClientRect();
            const own = slot.getBoundingClientRect();
            if (sibling.getClientRects().length && box.left < own.right - 0.5 && box.right > own.left + 0.5) {
              slotBottom -= box.height + gap;
            }
          }
          bottom = Math.min(bottom, slotBottom);
        }
        let count = entries.length;
        while (count && entries[count - 1].getBoundingClientRect().bottom > bottom + 0.5) entries[--count].classList.add('hidden');
        list.dataset.storyFit = 'complete';
        list.dataset.storyCount = String(count);
        list.dataset.storyBottom = String(bottom);
        if (entries.length && !count) starved.push(list);
      });
      return starved;
    };
    // D165: at a large device scale the header, scene and board can leave no room for even the newest story. Then
    // things give way in turn until it fits: the board a row at a time from the end farther from the hero, the scene
    // (with the code hung in its corner), the rest of the board, the standing bag code (never the urgent one), the
    // gear line, the stance, the counters, the XP ticks and the HP counter. The name, status and hearts stay. Each
    // stays hidden only if it gave a starved list more room, so nothing in another column goes for nothing.
    const room = lists => lists.reduce((sum, list) => sum + Number(list.dataset.storyBottom) - list.getBoundingClientRect().top + list.getBoundingClientRect().width, 0);
    // Hide the elements together; keep them hidden if that helped, and say whether it did.
    const tryGiving = els => {
      const lists = starved;
      const before = room(lists);
      els.forEach(giveWay);
      starved = fitLists();
      if (starved.length < lists.length || room(lists) > before + 0.5) return true;
      els.forEach(restore);
      starved = fitLists();
      return false;
    };
    const shown = el => el.getClientRects().length > 0 && !starved.some(list => list.contains(el) || el.contains(list));
    let starved = fitLists();
    while (scaled && starved.length) {
      const rows = Array.from(view.querySelectorAll('[data-rank-row]')).filter(shown);
      if (rows.length < 2) break;
      const own = rows.findIndex(row => row.classList.contains('label--inverted'));
      const drop = own >= 0 && own > rows.length - 1 - own ? rows[0] : rows[rows.length - 1];
      const rule = drop.previousElementSibling && drop.previousElementSibling.matches('.border--h-30') ? drop.previousElementSibling : drop.nextElementSibling && drop.nextElementSibling.matches('.border--h-30') ? drop.nextElementSibling : null;
      if (!tryGiving(rule && rule.getClientRects().length ? [drop, rule] : [drop])) break;
    }
    const stages = ['[data-scene-art]', '[data-rank-panel], [data-board-column="og"], [data-board-column="x"], [data-board-columns]', '[data-home-qr], [data-companion-qr]:not([data-urgent])', '[data-gear-line]', '[data-stance]', '[data-counters="2"], [data-counters="words"]', '[data-xp-ticks]', '[data-counters="true"]'];
    for (const stage of scaled ? stages : []) {
      if (!starved.length) break;
      Array.from(view.querySelectorAll(stage)).filter(shown).forEach(el => { if (starved.length) tryGiving([el.matches('[data-scene-art]') && el.closest('[data-scene-row]') || el]); });
    }
    // The same parts give way, in the same order, while anything still runs below the title bar or into the recap
    // ribbon (a header taller than its slot, beside stories that fit): each stays hidden only if the spill shrank. Last
    // of all, the urgent code's caption and then the hearts may go too, so a bag-full panel keeps its code on the screen.
    const ribbon = Array.from(view.querySelectorAll('[data-recap-ribbon]')).find(el => el.getClientRects().length > 0);
    const spill = () => {
      const floor = Math.min(footer ? footer.getBoundingClientRect().top : Infinity, viewBox.bottom);
      const ribbonTop = ribbon ? ribbon.getBoundingClientRect().top : Infinity;
      return Array.from(layout.querySelectorAll('span, img, div')).filter(el => el.getClientRects().length > 0 && el.getBoundingClientRect().height > 0 && !el.closest('[data-story-list]') && !el.querySelector('[data-story-list]')).reduce((sum, el) => sum + Math.max(0, el.getBoundingClientRect().bottom - (ribbon && !ribbon.contains(el) ? Math.min(floor, ribbonTop) : floor)), 0);
    };
    let spilled = scaled ? spill() : 0;
    for (const stage of ['[data-rank-row]', stages[0], '[data-recap-item]', '[data-recap-span]', ...stages.slice(1), '[data-bag-full] span', '[data-companion-qr][data-urgent] span', '[data-hearts]']) {
      if (spilled <= 1) break;
      Array.from(view.querySelectorAll(stage)).filter(el => el.getClientRects().length > 0).reverse().forEach(el => {
        if (spilled <= 1 || el.classList.contains('label--inverted')) return;
        const target = el.matches('[data-scene-art]') && el.closest('[data-scene-row]') || el;
        giveWay(target);
        const after = spill();
        if (after < spilled - 0.5) spilled = after; else restore(target);
      });
    }
    if (spilled < Infinity) fitLists();
  };
  window.addEventListener('trmnl:terminalize:stats', fit);
  window.addEventListener('load', () => { if (window.TRMNL_PLUGINS_READY) fit(); }, { once: true });
  if (window.TRMNL_PLUGINS_READY) fit();
  // Webfonts can change wrapping after the framework's first measurement.
  if (document.fonts) document.fonts.ready.then(() => { if (window.TRMNL_PLUGINS_READY) fit(); });
})();
</script>`

/** The mark for one recap item (`item.k`): HUD marks for XP, gold, wins and potions, log glyphs for the rest. */
const recapIcon = `{% assign recap_size = "${COUNTER_ICON}" %}{% case item.k %}{% when "xp" %}{% assign recap_icon = hud_xp %}{% assign recap_size = "w--[24px] h--[16px] no-shrink ${ADAPTIVE}" %}{% when "coin" %}{% assign recap_icon = hud_coin %}{% when "sword" %}{% assign recap_icon = hud_sword %}{% when "potion" %}{% assign recap_icon = hud_potion %}${GLYPH_KINDS.filter((k) => k !== 'system')
  .map((k) => `{% when "${k}" %}{% assign recap_icon = glyph16_${k} %}`)
  .join('')}{% else %}{% assign recap_icon = "" %}{% endcase %}{% if recap_icon != "" %}<img class="{{ recap_size }}" src="{{ recap_icon }}" alt="">{% endif %}`

/**
 * The recap as one wrapping row: its name and hours ("Night recap 19:00-07:00"), then each fact behind its icon.
 * Each piece is unbreakable, so narrow columns wrap between pieces rather than inside "19:00-07:00". `lines` caps the
 * rows it may take; the fitter hides the trailing (least notable) facts that would need more.
 */
const recapRow = (lines: number, text: string, headingClasses = 'text--bold') =>
  `<div class="flex flex--row flex--wrap flex--left flex--center-y gap--medium stretch-x" data-recap-items="${lines}">` +
  `<span class="${text} ${headingClasses} no-shrink">{{ recap.label | escape }}</span>{% if recap.span %}<span class="${text} ${headingClasses} no-shrink" data-recap-span="true">{{ recap.span | escape }}</span>{% endif %}` +
  `{% for item in recap.items %}<div class="flex flex--row flex--center-y gap--xsmall no-shrink" data-recap-item="true">${recapIcon}<span class="${text}">{{ item.t | escape }}</span></div>{% endfor %}</div>`

/** Device recap is read-only and uses its own window, independent of the recent-story list. Quarter views allow two rows. */
const recapBlock = (lines = 3) => `
  {% if recap %}<div class="flex flex--col flex--left flex--stretch-x gap--xsmall stretch-x">
    ${recapRow(lines, 'label lg:title--small')}
    <div class="border--h-30 stretch-x"></div>
  </div>{% endif %}`

/** A separate bottom recap with breathing room above its text, fitted to one line. */
const recapRibbon = `
  {% if recap %}<div class="no-shrink stretch-x" data-recap-ribbon="true">
    <div class="border--h-30 stretch-x"></div>
    <div class="pt--2">${recapRow(1, 'label lg:title--small')}</div>
  </div>{% endif %}`

/**
 * The seven-day own-group board (D74, D89): the hero's own row inverted where it appears, and appended after the list
 * when it sits below the rows a device shows. The OG keeps three rows so every row stays at a readable size; the X
 * shows up to ten (`top10`, or `top5` from a payload that predates it), ruled like the story ledger. In the landscape
 * a hero below a full board takes the tenth row's place, so the column never holds more than ten rows.
 * `heading` (the portrait) opens the panel with the period and group set into a rule, the separator from the stories;
 * the full landscape carries it in the divider row instead.
 */
/** The row itself is the label, so an inverted own row keeps its text white: a `.label` child would set its own colour. */
const rankRow = (text: string, score: string, classes: string, own: string) =>
  `<div class="${classes}label lg:title--small flex flex--row flex--between flex--center-y stretch-x gap--small{% if ${own} %} label--inverted ${ink('bg', 'red')}{% endif %}" data-rank-row="{{ ${text === 'rank' ? 'rank' : 'row.rank'} }}">` +
  `<span class="grow w--min-0" data-clamp="1">{{ ${text} }}. {{ ${text === 'rank' ? 'owner_name' : 'row.name'} | escape }}</span>` +
  `<span class="no-shrink">{{ ${score} }}&nbsp;XP</span></div>`
/**
 * A vertical rule between the stories and the ranking in the full landscape, X only (the OG column has no width to
 * spare). The framework has no X-only border class, so it is its own element: `border--v-30` draws a one-pixel line
 * down its left edge, the shade of the horizontal rules, and the row stretches it to the column's height.
 */
const columnRule = '<div class="hidden lg:block no-shrink border--v-30" data-column-rule="true"></div>'
/** A ledger rule between board rows, X only. */
const rankRule = '<div class="hidden lg:block border--h-30 stretch-x"></div>'
/**
 * Pick the rows a board of `limit` shows (D152): from `board`, the rows around the hero, its window of `limit` rows
 * with the hero in the middle (one more above than below when even) and slid inside the rows sent. A hero outside the
 * rows sent (`board_own` nil) keeps the first rows and takes the last one's place (`board_append`). `prefix` names the
 * variables, so two boards in one panel do not overwrite each other.
 */
const boardWindow = (limit: number | string, prefix = 'board') => `{% assign board_rows = board | default: top10 | default: top5 %}` +
  `{% assign ${prefix}_limit = ${limit} %}{% assign ${prefix}_offset = 0 %}{% assign ${prefix}_append = false %}` +
  `{% if board_own != nil %}{% assign ${prefix}_half = ${prefix}_limit | divided_by: 2 | floor %}{% assign ${prefix}_max = board_rows.size | minus: ${prefix}_limit | at_least: 0 %}{% assign ${prefix}_offset = board_own | minus: ${prefix}_half | at_least: 0 | at_most: ${prefix}_max %}` +
  `{% elsif rank and rank > ${prefix}_limit %}{% assign ${prefix}_limit = ${prefix}_limit | minus: 1 %}{% assign ${prefix}_append = true %}{% endif %}`
const rankHeading = `${L('this_week')}{% if leaderboard_cohort_label != "" %} · {{ leaderboard_cohort_label | escape }}{% endif %}`
const boardRow = rankRow('row.rank', 'row.score', '', 'rank and row.rank == rank')
/** Period and group caption set into the rune rule above the ranking (D92); the OG shortens "Levels" to "Lv". */
const rankCaption = `<div class="flex flex--row flex--center-y gap--xsmall stretch-x">${ruleFill}<span class="label lg:title--small no-shrink lg:hidden">${L('this_week')}{% if leaderboard_cohort_label != "" %}{% assign cohort_long = labels.levels | default: "Levels " %}{% assign cohort_short = labels.lv | default: "Lv " %} · {{ leaderboard_cohort_label | replace: cohort_long, cohort_short | escape }}{% endif %}</span><span class="hidden lg:inline-block label lg:title--small no-shrink">${rankHeading}</span>${ruleFill}</div>`
/**
 * The OG full landscape's board beside its scene (the X keeps its ten-row column under the rule): the caption, then up
 * to five rows; a hero below them takes the fifth row's place, so the panel never outgrows the scene.
 */
const OG_BOARD_ROWS = 5
const ogBoard = `<div class="lg:hidden grow w--min-0 flex flex--col flex--left flex--top flex--stretch-x gap--xsmall" data-board-column="og">
      ${rankCaption}
      {% unless rank %}{% if rank_status == "dormant" %}<span class="label">${L('not_ranked_paused')}</span>{% else %}<span class="label">${L('ranking_soon')}</span>{% endif %}{% endunless %}
      ${boardWindow(OG_BOARD_ROWS)}
      {% for row in board_rows offset: board_offset limit: board_limit %}${rankRow('row.rank', 'row.score', '', 'rank and row.rank == rank')}{% endfor %}
      {% if board_append %}${rankRow('rank', 'leaderboard_score', '', 'true')}{% endif %}
    </div>`
const rankPanel = (heading: boolean) => `
      ${heading ? rankCaption : ''}
      {% unless rank %}{% if rank_status == "dormant" %}<span class="label lg:title--small">${L('not_ranked_paused')}</span>{% else %}<span class="label lg:title--small">${L('ranking_soon')}</span>{% endif %}{% endunless %}
      ${boardWindow(10, 'x')}{% for row in board_rows offset: x_offset limit: x_limit %}{% unless forloop.first %}${rankRule}{% endunless %}${boardRow}{% endfor %}
      {% if x_append %}${rankRule}${rankRow('rank', 'leaderboard_score', 'hidden lg:flex ', 'true')}{% endif %}`


/**
 * The one quiet attention message (service, delay, death, inventory sleep): never clipped, shown in every size. A
 * notice (D78: the merchant) takes the same slot as an outlined chip but leaves the stories and recap alone.
 */
const attention = (classes: string, clamp: number, leaves = false) => `
      {% if attention %}<span class="${classes} label--underline ${ink('text', 'red')} no-shrink" data-clamp="${clamp}">{{ attention | escape }}</span>{% else %}${standoffRow(classes, leaves)}{% if notice %}<div class="no-shrink pt--1"><span class="${classes} label--outline" data-clamp="${clamp}">{{ notice | escape }}</span></div>{% endif %}{% endif %}`

/**
 * D163: a dug-in elite in every layout: its name, its HP as ten half-step ticks (rounded up, so a standing elite never
 * shows empty) and the share left; the full layouts add when it leaves. It sits in the attention slot, so an attention
 * line (a knockout, a full bag) takes its place.
 */
const standoffRow = (classes: string, leaves: boolean) =>
  `{% if standoff %}{% assign standoff_halves = standoff.hp_pct | times: 20 | plus: 99 | divided_by: 100 | floor %}<div class="no-shrink flex flex--row flex--wrap flex--left flex--center-y gap--xsmall stretch-x" data-standoff="{{ standoff_halves }}">` +
  `<span class="${classes} text--bold">Elite {{ standoff.name | escape }}</span>` +
  `<div class="flex flex--row gap--[2px] no-shrink">{% for i in (1..10) %}{% assign tick_right = i | times: 2 %}{% assign tick_left = tick_right | minus: 1 %}<img class="${TICK_CLASSES}" src="{% if standoff_halves >= tick_right %}{{ hud_tick_full }}{% elsif standoff_halves >= tick_left %}{{ hud_tick_half }}{% else %}{{ hud_tick_empty }}{% endif %}" alt="">{% endfor %}</div>` +
  `<span class="${classes} no-shrink">{{ standoff.hp_pct }}%${leaves ? `{% if utc_offset != nil %} · ${L('leaves')} {{ standoff.leaves_at | plus: utc_offset | date: "%H:%M" }}{% endif %}` : ''}</span></div>{% endif %}`

/** Integer-scaled assets keep every QR module crisp on monochrome displays. */
const qrImage = (scale: number, largeScale: number, field = 'qr_base') =>
  `<img class="image lg:hidden" src="{{ ${field} }}/${scale}.png" alt=""><img class="image hidden lg:block" src="{{ ${field} }}/${largeScale}.png" alt="">`

/**
 * The full layouts' standing link (D88): a small unlabelled code to the companion home in the top-right corner. A full
 * bag takes it away, since the bag-full panel carries its own code.
 */
const homeQr = `{% if qr_base == "" and home_qr_base != "" %}<div class="no-shrink flex flex--col flex--center-x gap--xsmall" data-home-qr="true">${qrImage(2, 3, 'home_qr_base')}{% if keepsake_waiting %}${keepsakeCaption('label lg:title--small text--center')}{% endif %}</div>{% endif %}`

/**
 * How much of the bag panel a slot holds, OG and X apart: the code's scale on each (`qr`, as `qrImage` takes them), and
 * whether the small sleep scene and the attention line show on both, only the X, or neither.
 */
type BagFit = { readonly qr: readonly [number, number]; readonly scene: 'both' | 'x' | 'none'; readonly attention: 'both' | 'x' | 'none' }
/** Everything at the largest codes: the full portrait, the X's full and half views. */
const BAG_ROOMY: BagFit = { qr: [5, 7], scene: 'both', attention: 'both' }
/** The quarter: a smaller code, the slot count and a held find; the status line above already says why. */
const BAG_COMPACT: BagFit = { qr: [3, 5], scene: 'none', attention: 'none' }
const onlyOnX = (shown: BagFit['scene'], inner: string) => (shown === 'none' ? '' : shown === 'x' ? `<div class="hidden lg:block">${inner}</div>` : inner)

/**
 * A full bag (D88, D171): the adventure view gives way to this panel. The code is the largest each slot holds and
 * opens the bag. Slots and a held find say why adventures stopped. `qr_base` is set on an active hero only for a full bag.
 * The text column may shrink, so its lines clamp in a narrow slot rather than running off the screen.
 */
const bagFullPanel = (column: boolean, fit: BagFit = BAG_ROOMY) => `
  <div class="grow h--min-0 flex ${column ? 'flex--col' : 'flex--row'} flex--center-x flex--center-y gap--medium lg:gap--large stretch-x" data-bag-full="true">
    <div class="no-shrink flex flex--col flex--center-x gap--xsmall">
      ${qrImage(fit.qr[0], fit.qr[1])}
      <span class="label lg:title--small text--center" data-clamp="2">{{ qr_label | escape }}</span>
    </div>
    <div class="w--min-0 flex flex--col flex--left gap--small${column ? ' flex--center-x' : ''}">
      <span class="title lg:title--large">${L('bag_full')}</span>
      <span class="title--small lg:title--base${column ? ' text--center' : ''}" data-clamp="2">${L('bag_paused')}</span>
      <span class="label lg:title--small${column ? ' text--center' : ''}">{{ bag_used }}/{{ bag_capacity }} ${L('bag_slots')}</span>
      {% if held_item != "" %}<span class="label lg:title--small${column ? ' text--center' : ''}" data-clamp="2">${L('bag_holding')} {{ held_item | escape }}</span>{% endif %}
      ${onlyOnX(fit.scene, `{% if scene_url_small != "" %}<div class="no-shrink" data-scene-art="true"><img class="image" src="{{ scene_url_small }}" alt=""></div>{% endif %}`)}
      ${onlyOnX(fit.attention, attention('label lg:title--small', 2))}
    </div>
  </div>`

/** Name and status over the bag panel, for every layout that is not the full screen. */
const bagTakeover = (column: boolean, fit: BagFit = BAG_ROOMY) => `
  <div class="no-shrink flex flex--col flex--left gap--xsmall stretch-x" data-hero-header="true">
    <span class="title" data-clamp="1">{{ hero_name | escape }}, ${L('level')} {{ level }}</span>
    ${statusLine(2, 40)}
  </div>
  ${bagFullPanel(column, fit)}`

/** One reserved companion entry point per narrow view; an urgent action replaces the standing bag link. */
const bagQr = (scale = 3, largeScale = 4, caption = true) => `
  {% if qr_base != "" or companion_qr_base != "" %}<div class="no-shrink flex flex--col flex--center-x flex--top gap--xsmall" data-companion-qr="true"{% if qr_base != "" %} data-urgent="true"{% endif %}>
    {% if qr_base != "" %}${qrImage(scale, largeScale)}<span class="label lg:title--small text--center" data-clamp="2">{{ qr_label | escape }}</span>
    {% else %}${qrImage(scale, largeScale, 'companion_qr_base')}${caption ? `{% if keepsake_waiting %}${keepsakeCaption('label lg:title--small text--center')}{% else %}<span class="label lg:title--small">${L('your_bag')}</span>{% endif %}` : ''}{% endif %}
  </div>{% endif %}`

/**
 * Equipped gear with its slot named, so a find reads as a weapon or armor at a glance (X only: the OG has no spare line).
 * One line under the HUD rows in both full arrangements, wrapping where the HUD block is short.
 */
const gearName = (field: string) => `<span class="text--bold inline-block">{% if ${field} != "" %}{{ ${field} | escape }}{% else %}${L('none')}{% endif %}</span>`
const gearLine = `{% assign gear_none = labels.none | default: "None" %}{% assign gear_plain = weapon | default: gear_none | append: armor | default: gear_none %}<div class="hidden lg:block stretch-x" data-gear-line="true"><span class="title--small text--regular" ${fitClamp('gear_plain', 1, 44)}>${L('weapon')} ${gearName('weapon')} · ${L('armor')} ${gearName('armor')}</span></div>`
/** The gear on two lines, weapon over armor, for the X half's narrow details column (D97). */
const gearLines = `<div class="flex flex--col flex--left gap--xsmall stretch-x" data-gear-line="stacked"><span class="title--small text--regular">${L('weapon')} ${gearName('weapon')}</span><span class="title--small text--regular">${L('armor')} ${gearName('armor')}</span></div>`
/**
 * The gear behind the attack and defense marks instead of the slot words, for the X side's header: each item keeps its
 * mark, and the armor drops under the weapon where both names don't fit one line.
 */
const gearIcon = (icon: string, field: string) =>
  `<div class="flex flex--row flex--center-y gap--[3px] w--min-0"><img class="${COUNTER_ICON}" src="{{ ${icon} }}" alt=""><span class="title--small text--regular">${gearName(field)}</span></div>`
const gearIcons = `<div class="flex flex--row flex--wrap flex--left flex--center-y gap--small stretch-x" data-gear-line="icons">${gearIcon('hud_sword', 'weapon')}${gearIcon('hud_shield', 'armor')}</div>`
/**
 * The OG's gear line: the attack and defense marks name the slots, since the HUD block has no width for the words, and
 * each name clamps on its own so a long weapon never hides the armor.
 */
const gearItem = (icon: string, field: string, none: string) =>
  `<div class="flex flex--row flex--center-y gap--[3px] w--min-0"><img class="${COUNTER_ICON}" src="{{ ${icon} }}" alt=""><span class="label" data-clamp="1">{% if ${field} != "" %}{{ ${field} | escape }}{% else %}${none}{% endif %}</span></div>`
const gearLineOg = `<div class="lg:hidden flex flex--row flex--left flex--center-y ${COUNTER_GAP} stretch-x" data-gear-line="og">${gearItem('hud_sword', 'weapon', L('no_weapon'))}${gearItem('hud_shield', 'armor', L('no_armor'))}</div>`

/**
 * `shortColumn` is the column for the portrait half and `narrowColumn` for the portrait quarter. Neither slot has the
 * height for scene art above the full-size code; the 240-pixel OG quarter also keeps the quadrant's one-line text.
 */
type WelcomeLayout = 'full' | 'halfVertical' | 'halfHorizontal' | 'quadrant' | 'shortColumn' | 'narrowColumn'

/**
 * First-run panel: setup (no active hero) or a brand-new hero before its first
 * adventure. The QR is the main element: the largest code the OG and the X each
 * serve, with a short heading and two or three lines. The panel grows to the
 * title bar and centers its content, so no size leaves a blank band below it.
 * The scan line only appears while a code is on screen (a paused service has
 * none); the OG quarter keeps one short line, the X quarter the full set.
 * The scene sits in a full-width block so the column's centering never lets it overflow a narrow panel.
 */
const welcome = (layout: WelcomeLayout) => {
  const compact = layout === 'quadrant' || layout === 'narrowColumn'
  const title = compact ? 'title title--small lg:title--large' : 'title lg:title--large'
  const column = layout === 'halfVertical' || layout === 'shortColumn' || layout === 'narrowColumn'
  const line = (visibility = '') => `${visibility ? `${visibility} ` : ''}label lg:title--small${column ? ' text--center' : ''}`
  const heading = `{% if status != "unlinked" %}{% assign ready_name = hero_name | escape %}{{ labels.ready | default: "${DEVICE_WORDS.en.labels.ready}" | replace: "%name%", ready_name }}{% elsif data_state == "service_paused" %}${L('back_soon')}{% else %}${L('finish_setup')}{% endif %}`
  const detail = (visibility = '') => `{% if status == "unlinked" %}{% if qr_base != "" %}<span class="${line(visibility)}" data-clamp="2">${L('scan_phone')}</span>{% endif %}
      <span class="${line(visibility)}" data-clamp="3">{{ attention | escape }}</span>{% else %}<span class="${line(visibility)}" data-clamp="2">${L('first_15')}</span>
      <span class="${line(visibility)}" data-clamp="3">${L('scan_manage')}</span>{% endif %}
      <span class="${line(visibility)}">trmnlgames.com</span>`
  const lines = compact
    ? `<span class="${line('lg:hidden')}" data-clamp="2">{% if status != "unlinked" %}${L('first_15_short')}{% elsif qr_base != "" %}${L('scan_phone_short')}{% else %}{{ attention | escape }}{% endif %}</span>
      ${detail('hidden lg:block')}`
    : detail()
  const text = `
    <div class="flex flex--col flex--left gap--small${column ? ' flex--center-x' : ''}">
      <span class="${title}" data-clamp="1">${heading}</span>
      ${lines}
    </div>`
  const code = `{% if qr_base != "" %}<div class="no-shrink">${qrImage(5, 7)}</div>{% endif %}`
  const body = column
    ? `${layout === 'halfVertical' ? `<div class="stretch-x">${scene('scene_url_small')}</div>` : ''}
    <div class="flex flex--col flex--center-x gap--small">
      ${code}${text}
    </div>`
    : `${layout === 'full' ? scene('scene_url') : ''}
    <div class="flex flex--row flex--center-x flex--center-y gap--large lg:gap--xlarge">
      ${code}${text}
    </div>`
  return `
  <div class="grow flex flex--col flex--center-x flex--center-y gap--small lg:gap--medium stretch-x">${body}
  </div>`
}


/**
 * Landscape and portrait arrangements of one view; the framework's `portrait:` classes show the one that matches the
 * device. Each hides itself in the other orientation; showing one with `portrait:flex` would make it a row whose
 * stretch-x children all take an equal share of the height. Each arrangement carries its own title bar because the
 * framework sizes a layout only when the title bar is its next sibling (`.layout:has(+.title_bar)`).
 */
const oriented = (classes: string, landscape: string, portrait: string, bar: string, portraitBar = bar) => `
<div class="${classes} portrait:hidden">${landscape}
</div>${bar.replace('class="title_bar"', 'class="title_bar portrait:hidden"')}
<div class="${classes} landscape:hidden">${portrait}
</div>${portraitBar.replace('class="title_bar"', 'class="title_bar landscape:hidden"')}`

/** A standing companion QR beside its caption, for the narrow portrait columns; an urgent code keeps `scale`. */
const qrFooter = (scale = 3, largeScale = 4, classes = '', standingScale = scale) => `
  {% if qr_base != "" or companion_qr_base != "" %}<div class="${classes}no-shrink flex flex--row flex--left flex--center-y gap--small stretch-x" data-companion-qr="true"{% if qr_base != "" %} data-urgent="true"{% endif %}>
    {% if qr_base != "" %}<div class="no-shrink">${qrImage(scale, largeScale)}</div><span class="label lg:title--small grow" data-clamp="3">{{ qr_label | escape }}</span>
    {% else %}<div class="no-shrink">${qrImage(standingScale, largeScale, 'companion_qr_base')}</div>{% if keepsake_waiting %}${keepsakeCaption('label lg:title--small grow')}{% else %}<span class="label lg:title--small grow">${L('your_bag')}</span>{% endif %}{% endif %}
  </div>{% endif %}`

/**
 * The full landscape's standing link. On the OG the corner-cut code (D108) hangs out of the flow in the view's top-right
 * corner, the screen's margin standing in for its top and right quiet zone, so the hearts and XP keep clear of it while
 * the gear line runs on underneath; the X keeps its 3x code at the end of the header row.
 */
const cornerQr = `{% if qr_base == "" and home_qr_base != "" %}<div class="hidden lg:block no-shrink" data-home-qr="true"><div class="flex flex--col flex--center-x gap--xsmall"><img class="image" src="{{ home_qr_base }}/3.png" alt="">{% if keepsake_waiting %}${keepsakeCaption('title--small text--center')}{% endif %}</div></div>` +
  `{% if corner_qr_base != "" %}<div class="lg:hidden absolute top--0 right--0" data-home-qr="corner"><img class="image" src="{{ corner_qr_base }}/2.png" alt=""></div>{% endif %}{% endif %}`

/**
 * The X's own arrangements of the half, side and quarter views (D95). The OG keeps its arrangements, each top-level
 * block marked `lg:hidden`; these blocks are `hidden lg:block` and lay their content out in an inner flex box, since
 * `lg:flex` would bring the framework's default gap over the gap classes. They borrow the X full layout's pieces: the
 * named header, the hearts and XP with their counts, the gear line, a ledger of stories and a ruled board.
 */
const xBlock = (inner: string, classes = 'no-shrink') => `<div class="hidden lg:block ${classes} stretch-x">${inner}</div>`
/**
 * The hero's name and level with the attack and defense marks. Narrow columns clamp a name longer than `clamp`
 * characters to one line; shorter names never clamp, since the clamp measures before the row settles. `wrap` lets the
 * attack and defense marks drop under a name too wide to share their line (the X half's details column, D97).
 */
const xName = (clamp = 0, size = 'title', wrap = false) => {
  const row = nameRow(`<span class="${size} ${clamp ? `w--min-0" data-clamp="{% if hero_name.size > ${clamp} %}1{% else %}0{% endif %}" data-clamp-lg="{% if hero_name.size > ${clamp} %}1{% else %}0{% endif %}` : 'no-shrink'}">{{ hero_name | escape }}, ${L('level')} {{ level }}</span>`)
  return wrap ? row.replace('flex--center-y gap--small stretch-x" data-name-row', 'flex--wrap flex--center-y gap--small stretch-x" data-name-row') : row
}
/**
 * The full layout's header: hero, status and named counters beside the hearts, XP and gear, with a code at the end. As
 * in the full portrait (D93) the HUD slot grows from no basis with a minimum that holds a hearts row and its count, so
 * only the longest names move it under the hero.
 */
const xHeader = (code: string) => `<div class="flex flex--row flex--top gap--large stretch-x">
      <div class="grow w--min-0"><div class="flex flex--row flex--wrap flex--top flex--between gap--large" data-hero-header="x">
        <div class="no-shrink flex flex--col flex--left gap--xsmall">${xName()}${statusLine(2, 56)}${heroCounters}</div>
        <div class="grow basis--0 w--min-80 flex flex--col flex--right" data-hud-slot="true"><div class="pt--2 flex flex--col flex--left gap--xsmall" data-hud-block="true">${hudWide(false)}${gearLine}</div></div>
      </div></div>${code}
    </div>`
/** A column's stacked header: the name line, status and named counters, then the hearts, XP and gear lines. */
const xStackedHeader = (clamp: number, gear = gearLine) => `<div class="flex flex--col flex--left flex--stretch-x gap--xsmall stretch-x" data-hero-header="x">${xName(clamp)}${statusLine(2, 40)}${heroCounters}${hearts(true)}${xpTicks()}${gear}</div>`
/**
 * The X header's code: the urgent code with its label when there is one, else the standing bag code. Unlabelled, as
 * in the full layout's corner (D88).
 */
const xCode = `{% if qr_base != "" or companion_qr_base != "" %}<div class="no-shrink flex flex--col flex--center-x gap--xsmall w--[96px]" data-companion-qr="true"{% if qr_base != "" %} data-urgent="true"{% endif %}>{% if qr_base != "" %}<img class="image" src="{{ qr_base }}/3.png" alt=""><span class="title--small text--center" data-clamp="2">{{ qr_label | escape }}</span>{% else %}<img class="image" src="{{ companion_qr_base }}/3.png" alt="">{% if keepsake_waiting %}${keepsakeCaption('title--small text--center')}{% endif %}{% endif %}</div>{% endif %}`
/** The standing bag code hung in a scene's corner, like the full portrait's (D93); an urgent code keeps its own block. */
const xSceneCode = `{% if qr_base == "" and companion_qr_base != "" %}<div class="absolute top--0 right--0 flex bg--black p--1" data-companion-qr="true"><img class="image" src="{{ companion_qr_base }}/3.png" alt=""></div>{% endif %}`
const xScene = (field: SceneField, code = '') => `{% if ${field} != "" %}<div class="relative no-shrink" data-scene-row="x" data-scene-art="true"><img class="image" src="{{ ${field} }}" alt="">${code}</div>{% endif %}`
/**
 * A ruled board of up to `limit` rows under its caption; a hero below them takes the last row's place. The X keeps
 * whole rows at its size, so the narrow columns clamp the name rather than the score.
 */
const xBoard = (limit: number, fit = false) => `<div class="flex flex--col flex--left flex--top flex--stretch-x gap--xsmall stretch-x" data-board-column="x"${fit ? ' data-fit-rows="true"' : ''}>
      ${rankCaption}
      {% unless rank %}{% if rank_status == "dormant" %}<span class="title--small">${L('not_ranked_paused')}</span>{% else %}<span class="title--small">${L('ranking_soon')}</span>{% endif %}{% endunless %}
      ${boardWindow(limit)}
      {% for row in board_rows offset: board_offset limit: board_limit %}{% unless forloop.first %}<div class="border--h-30 stretch-x"></div>{% endunless %}${rankRow('row.rank', 'row.score', '', 'rank and row.rank == rank')}{% endfor %}
      {% if board_append %}<div class="border--h-30 stretch-x"></div>${rankRow('rank', 'leaderboard_score', '', 'true')}{% endif %}
    </div>`
/**
 * The stories under the attention line, the recap (capped at `recapLines`, none for 0) and the badge. `inline` puts each
 * story on one line with stat columns.
 */
const xLedger = (inline: boolean, recapLines: number) => `<div class="grow w--min-0 h--full flex flex--col flex--left flex--top flex--stretch-x gap--small" data-ledger="x">
      {% if attention %}${attention('title--small', 3, true)}{% else %}${attention('title--small', 3, true)}${recapLines ? recapBlock(recapLines) : ''}{% endif %}
      {% unless recap %}${celebrationBadge('title--small')}{% endunless %}${inline ? storyList(2, 'title', 24, 64, false, 'lg') : storyList(2, 'title', 24, 50)}
    </div>`

/**
 * Half, landscape on the X (D97): a details column (the hero, status and named counters over the hearts, XP and gear,
 * then a board fitted to what is left of the column; its counts go by their marks alone, so the stance shares their row, D103) beside the rune rule stood on end; to its right the 3x scene and the
 * code over a thin rule (horizontal room is spare, height is not), then a one-line ledger. The hero block sits tight (D103), so the board shows up to four rows, which the recap ribbon or a long name can shorten.
 */
const xHalfWide = `
  ${xBlock(`<div class="grid h--full stretch-x gap--large">
    <div class="col--span-4 h--full w--min-0 flex flex--col flex--left flex--top flex--stretch-x gap--small" data-fit-bound="true" data-details-column="x">
      <div class="flex flex--col flex--left gap--xsmall stretch-x">
        <div class="flex flex--col flex--left gap--xsmall stretch-x" data-hero-header="x">${xName(12, 'title', true)}${statusLine(2, 56)}${hudRow('data-counters="2"', goldPotions() + bagCount() + stanceCount(), COUNTER_GAP)}</div>
        <div class="flex flex--col flex--left gap--xsmall stretch-x" data-hud-block="true">${hudWide(false)}${gearLines}</div>
      </div>
      ${xBoard(4, true)}
    </div>
    <div class="col--span-8 h--full w--min-0 flex flex--row flex--stretch-y gap--large">
      ${runeRuleV}
      <div class="grow w--min-0 h--full flex flex--col flex--top flex--stretch-x gap--xsmall">
        <div class="no-shrink flex flex--row flex--center-y gap--large stretch-x"><div class="grow w--min-0 flex flex--row flex--center-x">${xScene('scene_url_medium')}</div>${xCode}</div>
        <div class="no-shrink bg--black h--[1px] stretch-x" data-scene-rule="true"></div>
        ${xLedger(true, 0)}
      </div>
    </div>
  </div>`, 'grow h--min-0')}`

/**
 * Half, portrait on the X: the full header, the scene (the bag code hung in its corner, so the header keeps the width
 * for the hero and the HUD side by side) beside a board, a rune rule, then a one-line ledger. An urgent code takes the
 * header's end with its label.
 */
const xHalfTall = `
  ${xBlock(xHeader(`{% if qr_base != "" %}${xCode}{% endif %}`))}
  ${xBlock(`<div class="flex flex--col gap--small stretch-x"><div class="flex flex--row flex--top gap--large stretch-x">${xScene('scene_url_medium', xSceneCode)}<div class="grow w--min-0">${xBoard(5)}</div></div>${divider}</div>`)}
  ${xBlock(`<div class="flex flex--col flex--stretch-x h--full stretch-x">${xLedger(true, 1)}</div>`, 'grow h--min-0')}`

/**
 * Side on the X: the stacked header with the code in its top-right corner, the gear under both behind the attack and
 * defense marks (one line where the slot words would wrap), the scene clear of any code, a rune rule, the stories, the board, then the recap ribbon
 * at the foot as in the full portrait (D104). The portrait column, narrower, keeps the gear words, takes the 2x scene
 * with the recap over the stories, and closes with the bag code instead.
 */
const xSide = (portrait: boolean) => portrait
  ? `
  ${xBlock(xStackedHeader(10))}
  ${xBlock(`<div class="flex flex--col flex--center-x gap--small stretch-x">${xScene('scene_url_small')}${divider}</div>`)}
  ${xBlock(`<div class="flex flex--col flex--stretch-x h--full stretch-x">${xLedger(false, 3)}</div>`, 'grow h--min-0')}
  ${xBlock(xBoard(5))}
  ${xBlock(qrFooter(3, 3))}`
  : `
  ${xBlock(`<div class="flex flex--col flex--stretch-x gap--xsmall stretch-x"><div class="flex flex--row flex--top gap--large stretch-x"><div class="grow w--min-0">${xStackedHeader(12, '')}</div>${xCode}</div>${gearIcons}</div>`)}
  ${xBlock(`<div class="flex flex--col flex--center-x gap--small stretch-x">${xScene('scene_url_medium')}${divider}</div>`)}
  ${xBlock(`<div class="flex flex--col flex--stretch-x h--full stretch-x">${xLedger(false, 0)}</div>`, 'grow h--min-0')}
  ${xBlock(xBoard(4))}
  {% unless attention %}${xBlock(recapRibbon)}{% endunless %}`

/**
 * Quarter on the X: the name line and status beside the bag code, the hearts and XP with their counts under them, then
 * the stories across the width. The landscape's tiny scene beside the code is gone, and its recap is the ribbon at the
 * foot as in the side (D104); the portrait keeps the recap over the stories and closes with the code.
 */
const xQuadrant = (portrait: boolean) => `
  ${xBlock(portrait
    ? `<div class="flex flex--col flex--left flex--stretch-x gap--xsmall stretch-x" data-hero-header="x">${xName(10, 'title--small')}${statusLine(2, 40)}${hearts(true)}${xpTicks()}</div>`
    : `<div class="flex flex--row flex--top gap--medium stretch-x"><div class="grow w--min-0 flex flex--col flex--left flex--stretch-x gap--xsmall" data-hero-header="x">${xName(14, 'title--small')}${statusLine(1, 40)}${hearts(true)}${xpTicks()}</div>${xCode}</div>`)}
  ${xBlock(`<div class="flex flex--col flex--stretch-x h--full stretch-x"><div class="grow w--min-0 h--full flex flex--col flex--left flex--top flex--stretch-x gap--xsmall" data-ledger="x">
      {% if attention %}${attention('title--small', 3)}{% else %}${attention('title--small', 3)}${portrait ? recapBlock(2) : ''}{% endif %}
      ${storyList(2, 'title--small', 16, 40, portrait)}
    </div></div>`, 'grow h--min-0')}
  ${portrait ? xBlock(qrFooter(3, 3)) : `{% unless attention %}${xBlock(recapRibbon)}{% endunless %}`}`

/** Side, portrait: a narrow column. Hero and health first, the stories take the height, the companion QR closes the column. */
const halfVerticalPortrait = `
  {% if status == "unlinked" or first_run %}${welcome('halfVertical')}
  {% elsif qr_base != "" %}${bagTakeover(true, { qr: [4, 7], scene: 'x', attention: 'both' })}
  {% else %}
  <div class="lg:hidden no-shrink flex flex--col flex--left flex--stretch-x gap--xsmall stretch-x">
    <span class="title title--small" data-clamp="1">{{ hero_name | escape }}, ${L('level')} {{ level }}</span>
    ${statusLine(2, 24)}${hearts(false)}${xpTicks()}${counters()}
  </div>
  <div class="lg:hidden no-shrink stretch-x">${divider}</div>
  <div class="lg:hidden grow h--min-0 flex flex--col flex--left flex--top flex--stretch-x gap--small stretch-x">
    {% if attention %}${attention('label lg:title--small', 4)}{% else %}${attention('label lg:title--small', 4)}${recapBlock()}{% endif %}
    {% unless recap %}${celebrationBadge('label lg:title--small')}{% endunless %}${storyList(3, 'label lg:title--small', 16, 26, true)}
  </div>
  ${qrFooter(3, 4, 'lg:hidden ')}${xSide(true)}
  {% endif %}`

/**
 * The OG quarter's status line, only where the hearts and stories would mislead: paused, knocked out with its return
 * time, or asleep until a set time. Exploring is the default, a journey leads the stories and a full bag has its
 * attention line.
 */
const quarterStatus = `{% assign quarter_status = true %}{% if status == "exploring" or status == "resting" or status == "travelling" %}{% assign quarter_status = false %}{% endif %}{% if status == "sleeping" and attention %}{% assign quarter_status = false %}{% endif %}{% if quarter_status %}${statusLine(2, 40)}{% endif %}`

/** Quarter, portrait: hero line, the stories, then the companion QR across the bottom. */
const quadrantPortrait = `
  {% if status == "unlinked" or first_run %}${welcome('narrowColumn')}
  {% elsif qr_base != "" %}${bagTakeover(true, BAG_COMPACT)}
  {% else %}
  <div class="lg:hidden no-shrink flex flex--col flex--left flex--stretch-x gap--xsmall stretch-x">
    <span class="label" data-clamp="1">{{ hero_name | truncate: 13 | escape }}, ${L('level')} {{ level }}</span>
    ${hearts(false)}${quarterStatus}
  </div>
  <div class="lg:hidden grow h--min-0 flex flex--col flex--left flex--top flex--stretch-x gap--xsmall stretch-x">
    {% if attention %}${attention('label lg:title--small', 3)}{% else %}${attention('label lg:title--small', 3)}${recapBlock(2)}{% endif %}
    ${storyList(3, 'label lg:title--small', 16, 24, true)}
  </div>
  ${qrFooter(3, 4, 'lg:hidden ', 2)}${xQuadrant(true)}
  {% endif %}`

/**
 * Side, landscape: hero and QR side by side, then the recap and stories. A portrait Half has nearly the same proportions
 * but less height, so it uses this arrangement without the scene and with the one-line recap.
 */
const halfVerticalBody = (withScene: boolean) => `
  {% if status == "unlinked" or first_run %}${welcome(withScene ? 'halfVertical' : 'shortColumn')}
  {% elsif qr_base != "" %}${bagTakeover(withScene, { qr: [4, 7], scene: 'x', attention: 'x' })}
  {% else %}
  <div class="lg:hidden grid no-shrink stretch-x gap--small">
    <div class="col--span-8 flex flex--col flex--left flex--top flex--stretch-x gap--xsmall">
      <span class="title title--small" data-clamp="1">{{ hero_name | escape }}, ${L('level')} {{ level }}</span>
      ${statusLine(2, 42)}${hearts(false)}
      ${counters()}
    </div>
    <div class="col--span-4 flex flex--col flex--center-x flex--top">${bagQr()}</div>
  </div>
  <div class="lg:hidden no-shrink stretch-x">${divider}</div>
  <div class="lg:hidden grow h--full h--min-0 flex flex--col flex--left flex--top flex--stretch-x gap--small pt--2">
    {% if attention %}${attention('label lg:title--small', 3)}{% else %}${attention('label lg:title--small', 3)}${recapBlock()}{% endif %}
    {% unless recap %}${celebrationBadge('label lg:title--small')}{% endunless %}${storyList(2, 'title title--small', 24, 50)}
  </div>
  ${withScene ? xSide(false) : xHalfTall}
  {% endif %}
`

const halfVerticalLandscape = halfVerticalBody(true)
const halfHorizontalPortrait = halfVerticalBody(false)

/**
 * D138, X full landscape: today's three to-do tasks heading the board column, each behind a ticked or open box with
 * its progress at the end, ruled like the board under them. Labels keep their bold names; a long one takes two lines.
 */
const todoCaption = `<div class="flex flex--row flex--center-y gap--xsmall stretch-x">${ruleFill}<span class="label lg:title--small no-shrink">${L('todo_today')}</span>${ruleFill}</div>`
const todoColumn = `<div class="no-shrink flex flex--col flex--left flex--top flex--stretch-x gap--xsmall stretch-x" data-todo-column="x">
        {% for task in todo_tasks %}{% unless forloop.first %}<div class="border--h-30 stretch-x"></div>{% endunless %}<div class="label lg:title--small flex flex--row flex--center-y gap--small stretch-x" data-todo-task="{% if task.done %}done{% else %}open{% endif %}">
          <img class="image no-shrink ${ADAPTIVE}" src="{% if task.done %}{{ glyph16_todo }}{% else %}{{ glyph16_todoOpen }}{% endif %}" alt="">
          <span class="grow w--min-0" data-clamp="2">${richSpan(rich('task.t'))}</span>
          <span class="no-shrink">{% if task.done %}${L('done')}{% else %}{{ task.p }}/{{ task.n }}{% endif %}</span>
        </div>{% endfor %}
      </div>`
/**
 * D138, X full landscape: the current goal pinned under the stories behind the ladder glyph, its progress and gold at
 * the end; the story fitter drops the oldest stories to make room. A one-step goal shows no count. While a reached
 * goal's reward waits (D184) the row inverts and points to the companion instead of naming the next goal; the row is
 * the label, so its spans keep the inverted text colour, and the glyph stays outside the black.
 */
const goalLine = `{% if goal %}<div class="hidden lg:flex no-shrink flex--col flex--stretch-x gap--xsmall stretch-x" data-goal-line="x">
        <div class="border--h-30 stretch-x"></div>
        <div class="flex flex--row flex--center-y gap--small stretch-x pt--1">
          <img class="image no-shrink ${ADAPTIVE}" src="{{ glyph24_career }}" alt="">
          {% if goal.c %}<div class="title label--inverted ${ink('bg', 'red')} grow w--min-0 flex flex--row flex--center-y gap--small" data-goal-claim="x">
            <span class="grow w--min-0" data-clamp="1">${L('goal_claim')}</span>
            <span class="no-shrink">+{{ goal.g }} ${L('gold')}</span>
          </div>{% else %}
          <span class="title grow w--min-0" data-clamp="1"><span class="text--regular">${L('goal')}</span>{{ goal.t | escape }}</span>
          <span class="title--small no-shrink">{% if goal.n > 1 %}{{ goal.v }}/{{ goal.n }} · {% endif %}{{ goal.g }} ${L('gold')}</span>{% endif %}
        </div>
      </div>{% endif %}`

/** The OG keeps its six-row board in two columns, leaving room for full-width stories. */
const ogPortraitBoard = `${rankCaption}
  {% unless rank %}<span class="label">{% if rank_status == "dormant" %}${L('not_ranked_paused')}{% else %}${L('ranking_soon')}{% endif %}</span>{% endunless %}
  ${boardWindow(6)}{% assign board_right = board_offset | plus: 3 %}{% assign board_right_limit = board_limit | minus: 3 %}
  <div class="grid grid--cols-2 gap--medium stretch-x" data-board-columns="og">
    <div class="flex flex--col flex--top flex--stretch-x gap--xsmall">{% for row in board_rows offset: board_offset limit: 3 %}${boardRow}{% endfor %}</div>
    <div class="flex flex--col flex--top flex--stretch-x gap--xsmall">{% for row in board_rows offset: board_right limit: board_right_limit %}${boardRow}{% endfor %}{% if board_append %}${rankRow('rank', 'leaderboard_score', '', 'true')}{% endif %}</div>
  </div>`

/** A compact goal row above the tasks; only the title wraps, while progress and reward stay together. Inverted while a reward waits (D184). */
const portraitGoal = `{% if goal %}<div class="flex flex--row flex--top gap--small stretch-x" data-portrait-goal="true">
  <img class="image no-shrink ${ADAPTIVE}" src="{{ glyph16_career }}" alt="">
  {% if goal.c %}<div class="label lg:title--small label--inverted ${ink('bg', 'red')} grow w--min-0 flex flex--row flex--top gap--small" data-goal-claim="portrait">
    <span class="grow w--min-0" data-clamp="2">${L('goal_claim')}</span>
    <span class="no-shrink">+{{ goal.g }} ${L('gold')}</span>
  </div>{% else %}
  <span class="label lg:title--small grow w--min-0" data-clamp="2">${L('goal')}{{ goal.t | escape }}</span>
  <span class="label lg:title--small no-shrink">{% if goal.n > 1 %}{{ goal.v }}/{{ goal.n }} · {% endif %}{{ goal.g }} ${L('gold')}</span>{% endif %}
</div>{% endif %}`

/**
 * Full portrait: hero details and HUD stacked against the left edge, standing QR at the header's top right,
 * then the full-width scene and ledger. X closes with goal/tasks beside the compact ranking; OG keeps its board.
 */
const fullPortrait = `
  {% if status == "unlinked" or first_run %}${welcome('halfVertical')}
  {% else %}
  <div class="no-shrink flex flex--row flex--top gap--medium lg:gap--large stretch-x" data-portrait-header="true">
  <div class="grow w--min-0 flex flex--col flex--left flex--stretch-x gap--small" data-hero-header="true">
    <div class="flex flex--col flex--left gap--xsmall stretch-x">
      ${nameRow(`<span class="title lg:hidden w--min-0" data-clamp="1" data-name-long="true">{{ hero_name | truncate: 16 | escape }}, ${L('level')} {{ level }}</span><span class="title hidden w--min-0" data-name-short="true">{{ hero_name | truncate: 8 | escape }}, ${L('level')} {{ level }}</span>
      <span class="hidden lg:inline-block title no-shrink">{{ hero_name | escape }}, ${L('level')} {{ level }}</span>`)}
      ${statusLine(2, 40)}
      ${heroCounters}
    </div>
    <div class="flex flex--col flex--left stretch-x w--min-0" data-hud-slot="true">
      <div class="pt--2 flex flex--col flex--left gap--xsmall" data-hud-block="true">
        ${hudWide(false)}
        ${gearLine}${gearLineOg}
      </div>
    </div>
  </div>
  ${homeQr}
  </div>
  <div class="no-shrink flex flex--col gap--small stretch-x">
    <div class="relative stretch-x lg:pt--2" data-scene-row="true">${scene('scene_url_medium', 'scene_url', true)}</div>
    ${divider}
  </div>
  {% if qr_base != "" %}${bagFullPanel(true)}
  {% else %}
  <div class="grow h--min-0 flex flex--col flex--left flex--top flex--stretch-x gap--xsmall lg:gap--small stretch-x">
    ${attention('label lg:title--small', 3, true)}
    {% unless recap %}${celebrationBadge('label lg:title--small')}{% endunless %}${storyList(2, 'title', 24, 64, false, 'lg', 74, true)}
  </div>
  <div class="hidden lg:block no-shrink stretch-x pt--2" data-portrait-summary="true"><div class="flex flex--row flex--stretch-y gap--medium stretch-x">
    <div class="grow basis--0 flex flex--col flex--left flex--top flex--stretch-x gap--small w--min-0" data-portrait-objectives="true">
      ${portraitGoal}
      {% if todo_tasks.size > 0 %}${todoCaption}${todoColumn}{% endif %}
    </div>
    <div class="no-shrink border--v-30" data-portrait-column-rule="true"></div>
    <div class="grow basis--0 flex flex--col flex--left flex--top flex--stretch-x gap--xsmall w--min-0" data-rank-panel="portrait">
      ${xBoard(5)}
    </div>
  </div></div>
  <div class="lg:hidden no-shrink flex flex--col flex--left flex--stretch-x gap--xsmall stretch-x pt--1">${ogPortraitBoard}</div>
  {% endif %}
  {% unless attention %}${recapRibbon}{% endunless %}
  {% endif %}`

export const markupFull = `${glyphAssigns([16, 24])}{% assign glyph16_todoOpen = "${glyphUri('todoOpen', 16)}" %}${HUD_ASSIGNS}${KEEPSAKE_ASSIGNS}${oriented('layout layout--col layout--top layout--stretch-x gap--xsmall lg:gap--small', `
  {% if status == "unlinked" or first_run %}${welcome('full')}
  {% else %}
  <div class="relative no-shrink flex flex--row flex--top gap--medium stretch-x">
    <div class="grow w--min-0 flex flex--row flex--top flex--between gap--medium lg:gap--large" data-hero-header="true">
      <div class="no-shrink flex flex--col flex--left gap--xsmall">
        ${nameRow(`<span class="title lg:hidden w--min-0" data-clamp="1" data-name-long="true">{{ hero_name | truncate: 12 | escape }}, ${L('level')} {{ level }}</span><span class="title hidden w--min-0" data-name-short="true">{{ hero_name | truncate: 8 | escape }}, ${L('level')} {{ level }}</span>
        <span class="hidden lg:inline-block title no-shrink">{{ hero_name | escape }}, ${L('level')} {{ level }}</span>`)}
        ${statusLine(2, 56)}
        ${heroCounters}
      </div>
      <div class="w--min-0 pt--2 flex flex--col flex--left gap--xsmall" data-hud-block="true">
        <div class="flex flex--col flex--left gap--xsmall pr--16 lg:pr--0">${hudWide(false)}</div>
        ${gearLine}${gearLineOg}
      </div>
    </div>
    ${cornerQr}
  </div>
  <div class="no-shrink flex flex--col gap--small stretch-x">
    <div class="flex flex--row flex--top lg:flex--center-x gap--medium stretch-x" data-scene-row="true">
      {% if scene_url != "" %}<div class="no-shrink" data-scene-art="true">${sceneImage('scene_url_medium')}{% if qr_base == "" %}<img class="image hidden lg:block" src="{{ scene_url_large }}" alt="">{% endif %}</div>{% endif %}
      ${ogBoard}
    </div>
    <div class="grid stretch-x gap--none" data-rune-rule="true">
      <div class="col--span-12 lg:col--span-8 flex flex--row flex--center-y gap--none">${runeRule}</div>
      <div class="hidden lg:flex col--span-4 flex--row flex--center-y">{% if qr_base == "" %}{% if todo_tasks.size > 0 %}${todoCaption}{% else %}${rankCaption}{% endif %}{% else %}${ruleFill}{% endif %}</div>
    </div>
  </div>
  {% if qr_base != "" %}${bagFullPanel(false, { qr: [4, 7], scene: 'x', attention: 'x' })}
  {% else %}
  <div class="grid grow h--full h--min-0 stretch-x gap--small lg:gap--large pt--1 lg:pt--2" data-story-columns="true">
    <div class="col--span-12 lg:col--span-8 flex flex--col flex--left flex--top gap--xsmall lg:gap--small h--full">
      ${attention('label lg:title--small', 2, true)}
      {% unless recap %}${celebrationBadge('label lg:title--small')}{% endunless %}${storyList(2, 'title', 24, 64, false, 'all', 74, false, true)}
      ${goalLine}
    </div>
    <div class="hidden lg:block col--span-4"><div class="flex flex--row flex--stretch-y gap--medium h--full" data-board-column="true">
      ${columnRule}
      <div class="grow w--min-0 h--full flex flex--col flex--left flex--top flex--stretch-x gap--small" data-fit-bound="true">
        {% if todo_tasks.size > 0 %}${todoColumn}${xBoard(10, true)}
        {% else %}<div class="flex flex--col flex--left flex--top flex--stretch-x gap--xsmall stretch-x">${rankPanel(false)}</div>{% endif %}
      </div>
    </div></div>
  </div>
  {% endif %}
  {% unless attention %}${recapRibbon}{% endunless %}
  {% endif %}
`, fullPortrait, titleBar)}${fitStories}`

export const markupHalfHorizontal = `${glyphAssigns([16, 24])}${HUD_ASSIGNS}${KEEPSAKE_ASSIGNS}${oriented('layout layout--col layout--top layout--stretch-x gap--small', `
  {% if status == "unlinked" or first_run %}${welcome('halfHorizontal')}
  {% elsif qr_base != "" %}${bagTakeover(false, { qr: [3, 7], scene: 'x', attention: 'x' })}
  {% else %}
  <div class="lg:hidden grid grow h--full h--min-0 stretch-x gap--medium">
    <div class="col--span-4 flex flex--col flex--left flex--top flex--stretch-x gap--xsmall">
      <span class="title title--small" data-clamp="1">{{ hero_name | escape }}, ${L('level')} {{ level }}</span>
      ${statusLine(2, 36)}${hearts(false)}
      ${counters()}
    </div>
    <div class="col--span-6 h--full flex flex--col flex--left flex--top flex--stretch-x gap--xsmall lg:gap--small">
      ${attention('label lg:title--small', 3)}${storyList(2, 'label lg:title--small', 16, 62)}
    </div>
    <div class="col--span-2 flex flex--col flex--center-x flex--top">${bagQr()}</div>
  </div>${xHalfWide}
  {% unless attention %}${recapRibbon}{% endunless %}
  {% endif %}
`, halfHorizontalPortrait, titleBar)}${fitStories}`

export const markupHalfVertical = `${glyphAssigns([16, 24])}${HUD_ASSIGNS}${KEEPSAKE_ASSIGNS}${oriented('layout layout--col layout--top layout--stretch-x gap--small lg:gap--medium', halfVerticalLandscape, halfVerticalPortrait, titleBar, titleBarNarrow)}${fitStories}`

export const markupQuadrant = `${glyphAssigns([16])}${HUD_ASSIGNS}${KEEPSAKE_ASSIGNS}${oriented('layout layout--col layout--top layout--stretch-x gap--small', `
  {% if status == "unlinked" or first_run %}${welcome('quadrant')}
  {% elsif qr_base != "" %}${bagTakeover(false, BAG_COMPACT)}
  {% else %}
    <div class="lg:hidden no-shrink flex flex--row flex--left flex--center-y gap--small stretch-x">
      <span class="label grow w--min-0" data-clamp="1">{{ hero_name | truncate: 11 | escape }}, ${L('level')} {{ level }}</span>
      ${hearts(false)}
    </div>
    <div class="lg:hidden flex flex--row flex--top grow h--full h--min-0 stretch-x gap--small">
      <div class="grow w--min-0 h--full flex flex--col flex--left flex--top flex--stretch-x gap--xsmall">
        ${quarterStatus}{% if attention %}${attention('label lg:title--small', 3)}{% else %}${attention('label lg:title--small', 3)}${recapBlock(2)}{% endif %}
        ${storyList(2, 'label lg:title--small', 16, 46)}
      </div>
      <div class="no-shrink flex flex--col flex--center-x flex--top gap--small">${bagQr()}</div>
    </div>${xQuadrant(false)}
  {% endif %}
`, quadrantPortrait, titleBar, titleBarNarrow)}${fitStories}`

export const screenMarkup = {
  markup: markupFull,
  markup_half_horizontal: markupHalfHorizontal,
  markup_half_vertical: markupHalfVertical,
  markup_quadrant: markupQuadrant,
} as const

/** Largest real UTC offsets are -12:00 and +14:00. */
const MAX_UTC_OFFSET_SECONDS = 14 * 3600

/**
 * The `utc_offset` merge variable from TRMNL's `trmnl[user][utc_offset]` form field (seconds). Anything that is not a
 * whole number of seconds within ±14 hours is treated as absent, which omits the next-tick line.
 */
export function parseUtcOffset(raw: string | null): number | null {
  if (raw === null || !/^-?\d{1,5}$/.test(raw.trim())) return null
  const seconds = Number(raw.trim())
  return Math.abs(seconds) <= MAX_UTC_OFFSET_SECONDS ? seconds : null
}
