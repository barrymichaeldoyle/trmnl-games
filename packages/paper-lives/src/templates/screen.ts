/**
 * Paper Lives screen markup, an L2 placeholder (paper-lives.md "Device"): the name, the status line, the decision
 * or the close time, and the newest lines with their ages, in plain framework text. L3 replaces it with the portrait,
 * the stat bars, the board and the four drawn layouts on OG and X. User text arrives only as escaped variables.
 */
export const TEMPLATE_VERSION = 0

const title = '<div class="title_bar"><span class="title">Paper Lives</span><span class="instance">{{ name | escape }}</span></div>'

const lines = (count: number) =>
  `{% for line in lines limit: ${count} %}<p class="description">{{ line.age }}: {{ line.summary | escape }}</p>{% endfor %}`

const head = '<span class="title">{{ status_label | escape }}</span>'

const decision =
  '{% if memorial %}<p class="label">{{ memorial.epitaph | escape }}</p><p class="label">{{ memorial.prompt | escape }}</p>' +
  '{% elsif decision %}<p class="label">{{ decision.age }}: {{ decision.prompt | escape }} Decide in the companion.</p>{% endif %}'

const layout = (count: number) => `<div class="layout layout--col gap--small">${head}${decision}${lines(count)}{% if attention %}<p class="label">{{ attention | escape }}</p>{% endif %}</div>${title}`

export const screenMarkup = {
  markup: layout(6),
  markup_half_horizontal: layout(2),
  markup_half_vertical: layout(3),
  markup_quadrant: layout(1),
} as const
