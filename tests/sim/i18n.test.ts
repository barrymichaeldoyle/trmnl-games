import { describe, expect, it } from 'vitest'
import { catalogs, type CatalogId } from '@trmnl-games/desk-crawler/content'
import { ACHIEVEMENTS } from '@trmnl-games/desk-crawler/content/achievements'
import { contentTranslator, type ContentDictionary } from '@trmnl-games/desk-crawler/i18n'
import { ARTICLE_FORMS } from '@trmnl-games/desk-crawler/i18n/grammar'
import { fr } from '@trmnl-games/desk-crawler/i18n/fr'
import { de } from '@trmnl-games/desk-crawler/i18n/de'
import { POLICIES, simulateCohort } from '../../tools/balance/run'

/** Achievement names French writes the same way (loanwords and jargon). */
const SAME_IN_FRENCH = new Set(['Barista', 'Agile', 'Ding', 'Port 443', 'Patch Tuesday', 'Zero Trust', 'Getting Things Done', 'Pickpocket', 'Liquidation'])

const varsOf = (template: string) => [...template.matchAll(/\{(?:(\w+):)?(\w+)(?:\|[^}]*)?\}/g)].map((m) => ({ form: m[1], name: m[2]! }))

describe('content dictionaries (D169)', () => {
  it('translate the same English lines in French and German', () => {
    expect(Object.keys(fr.text).sort()).toEqual(Object.keys(de.text).sort())
    expect(Object.keys(fr.nouns).sort()).toEqual(Object.keys(de.nouns).sort())
    expect(Object.keys(fr.adjectives).sort()).toEqual(Object.keys(de.adjectives).sort())
  })

  it.each([['fr', fr], ['de', de]] as const)('%s templates only use the English line’s variables and known article forms', (locale, dictionary: ContentDictionary<unknown>) => {
    for (const [english, localized] of Object.entries(dictionary.text)) {
      const allowed = new Set([...varsOf(english).map((v) => v.name), 'hero'])
      for (const { form, name } of varsOf(localized)) {
        expect(allowed.has(name), `${locale}: {${name}} in "${localized}"`).toBe(true)
        if (form !== undefined && form !== 'e') expect(ARTICLE_FORMS[locale].includes(form.toLowerCase()), `${locale}: {${form}:${name}}`).toBe(true)
      }
    }
  })

  it('cover every name, line and achievement in every catalog', () => {
    const missing = new Set<string>()
    const t = contentTranslator('fr')
    for (const catalog of Object.values(catalogs)) {
      for (const monster of catalog.monsters) if (!(monster.name in fr.nouns)) missing.add(monster.name)
      for (const biome of catalog.biomes) if (!(biome.name in fr.nouns)) missing.add(biome.name)
      for (const gear of catalog.gearTemplates) if (!(gear.name in fr.nouns)) missing.add(gear.name)
      for (const effect of catalog.effects ?? []) if (t.text(effect.name) === effect.name) missing.add(effect.name)
      for (const rung of catalog.career?.rungs ?? []) if (t.text(rung.title) === rung.title) missing.add(rung.title)
    }
    for (const achievement of ACHIEVEMENTS) if (t.text(achievement.name) === achievement.name && !SAME_IN_FRENCH.has(achievement.name)) missing.add(achievement.name)
    expect([...missing]).toEqual([])
  })
})

describe('story translation (D169)', () => {
  const t = { fr: contentTranslator('fr'), de: contentTranslator('de') }

  it('puts names into sentences with their gender and article', () => {
    expect(t.fr.story('Defeated a [[Stapler Mimic]] by the printer. +12 XP, +5 gold.')).toBe('A vaincu une [[Mimique agrafeuse]] près de l’imprimante.')
    expect(t.de.story('Defeated a [[Stapler Mimic]] by the printer. +12 XP, +5 gold.')).toBe('Am Drucker eine [[Tacker-Mimik]] besiegt.')
    expect(t.fr.story('Arrived in the [[Archive]].')).toBe('Arrivée dans les [[Archives]].')
    expect(t.de.story('Arrived in the [[Parking Garage]].')).toBe('In der [[Tiefgarage]] angekommen.')
  })

  it('builds item names from affix, rarity and gear, with German endings', () => {
    expect(t.fr.name('Vampiric Rare Keyboard Mace')).toBe('Masse-clavier rare vampirique')
    expect(t.de.name('Vampiric Rare Keyboard Mace')).toBe('Vampirische seltene Tastaturkeule')
    expect(t.de.name('Lucky Rare Lanyard Mail Mk II +3')).toBe('Glückbringendes seltenes Schlüsselband-Kettenhemd Mk II +3')
    expect(t.fr.name('Letter Opener')).toBe('Coupe-papier')
  })

  it('agrees French participles with the hero', () => {
    expect(t.fr.story('Walked into the glass door. -4 HP.', { heroGender: 'female' })).toBe('S’est cognée contre la porte vitrée.')
    expect(t.fr.story('Walked into the glass door. -4 HP.', { heroGender: 'male' })).toBe('S’est cogné contre la porte vitrée.')
  })

  it('drops consequences the chips already show and keeps the rest', () => {
    expect(t.fr.story('Knocked out by a [[Ghost Car]]. Knocked out for about 2 hours. Lost 12 gold.')).toBe('K.-O. face à une [[Voiture fantôme]]. K.-O. pour environ 2 heures.')
    expect(t.de.story('Ticked off: Defeat 4 [[Paper Imps]]. Win 3 fights.')).toBe('Abgehakt: Besiege 4 [[Papierkobolde]]. Gewinne 3 Kämpfe.')
  })

  it('leaves player names alone and unmatched lines untranslated', () => {
    expect(t.fr.story('Raided [[Ana]]\'s desk while they were at lunch.')).toBe('A pillé le bureau de [[Ana]] pendant sa pause déjeuner.')
    expect(t.fr.story('A line nobody wrote.')).toBeNull()
    expect(contentTranslator('en').story('Arrived in the [[Archive]].')).toBeNull()
  })

  it.each(['v1', 'v9', 'v14', 'v19', 'v24'] as CatalogId[])('translates every story the %s simulator writes', (version) => {
    const summaries = new Set<string>()
    simulateCohort(POLICIES[0]!, 6, 25, catalogs[version], undefined, undefined, 'warrior', (_hero, _tick, _before, result) => {
      if (result.event) summaries.add(result.event.summary)
      for (const extra of result.extraEvents ?? []) summaries.add(extra.summary)
    })
    expect(summaries.size).toBeGreaterThan(50)
    for (const locale of ['fr', 'de'] as const) {
      const untranslated = [...summaries].filter((summary) => t[locale].story(summary) === null)
      expect(untranslated, `${locale} ${version}`).toEqual([])
    }
  })
})
