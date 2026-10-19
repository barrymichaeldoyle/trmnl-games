import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { contentsOf } from '../../apps/web/src/routes/help/-idleAnglerHelp'
import { en } from '../../apps/web/src/routes/help/-idleAnglerHelp.en'
import { fr } from '../../apps/web/src/routes/help/-idleAnglerHelp.fr'
import { de } from '../../apps/web/src/routes/help/-idleAnglerHelp.de'
import { es } from '../../apps/web/src/routes/help/-idleAnglerHelp.es'
import { it as itPage } from '../../apps/web/src/routes/help/-idleAnglerHelp.it'
import { pt } from '../../apps/web/src/routes/help/-idleAnglerHelp.pt'
import { pl } from '../../apps/web/src/routes/help/-idleAnglerHelp.pl'
import { nl } from '../../apps/web/src/routes/help/-idleAnglerHelp.nl'

const PAGES = { en, fr, de, es, it: itPage, pt, pl, nl }
/** Game names that should read in the reader's language once a page is translated (D200). */
const ENGLISH_NAMES = ['Millpond', 'River Bend', 'Harbour Pier', 'Heron Lake', 'Frozen Tarn', 'Waders', 'Pier Permit', 'Rowing Boat', 'Ice Auger', 'Carbon Rod', 'Boat Rod', 'Newcomer', 'Master Angler']

describe('Idle Angler help in every language (D200)', () => {
  it.each(Object.entries(PAGES))('renders %s with every section, no gaps and its own names', (locale, page) => {
    const html = renderToStaticMarkup(createElement(page.Body))
    const text = html.replace(/<[^>]+>/g, ' ')
    expect(text).not.toMatch(/undefined|NaN|\[object/)
    for (const [id, label] of contentsOf(page)) {
      expect(html, id).toContain(`id="${id}"`)
      expect(label.length, id).toBeGreaterThan(2)
    }
    if (locale !== 'en') expect(ENGLISH_NAMES.filter((name) => text.includes(name))).toEqual([])
  })
})
