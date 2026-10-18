import { describe, expect, it } from 'vitest'
import { catalogs, type CatalogId } from '@trmnl-games/desk-crawler/content'
import { ACHIEVEMENTS } from '@trmnl-games/desk-crawler/content/achievements'
import { contentTranslator, type ContentDictionary } from '@trmnl-games/desk-crawler/i18n'
import { AGREEMENT_FORMS, ARTICLE_FORMS, type GrammarLocale } from '@trmnl-games/desk-crawler/i18n/grammar'
import { fr } from '@trmnl-games/desk-crawler/i18n/fr'
import { de } from '@trmnl-games/desk-crawler/i18n/de'
import { es } from '@trmnl-games/desk-crawler/i18n/es'
import { it as italian } from '@trmnl-games/desk-crawler/i18n/it'
import { pt } from '@trmnl-games/desk-crawler/i18n/pt'
import { pl } from '@trmnl-games/desk-crawler/i18n/pl'
import { nl } from '@trmnl-games/desk-crawler/i18n/nl'
import { POLICIES, simulateCohort } from '../../tools/balance/run'

/** D169, D192: every translated language and its content dictionary. */
const DICTIONARIES: ReadonlyArray<readonly [GrammarLocale, ContentDictionary<unknown>]> = [['fr', fr], ['de', de], ['es', es], ['it', italian], ['pt', pt], ['pl', pl], ['nl', nl]]

const varsOf = (template: string) => [...template.matchAll(/\{(?:(\w+):)?(\w+)(?:\|[^}]*)?\}/g)].map((m) => ({ form: m[1], name: m[2]! }))

describe('content dictionaries (D169)', () => {
  it.each(DICTIONARIES.slice(1))('%s translates the same English lines as French', (_locale, dictionary) => {
    expect(Object.keys(dictionary.text).sort()).toEqual(Object.keys(fr.text).sort())
    expect(Object.keys(dictionary.nouns).sort()).toEqual(Object.keys(fr.nouns).sort())
    expect(Object.keys(dictionary.adjectives).sort()).toEqual(Object.keys(fr.adjectives).sort())
  })

  it.each(DICTIONARIES)('%s templates only use the English line’s variables and known article forms', (locale, dictionary) => {
    for (const [english, localized] of Object.entries(dictionary.text)) {
      const allowed = new Set([...varsOf(english).map((v) => v.name), 'hero'])
      for (const { form, name } of varsOf(localized)) {
        expect(allowed.has(name), `${locale}: {${name}} in "${localized}"`).toBe(true)
        if (form !== undefined && !AGREEMENT_FORMS[locale].includes(form)) expect(ARTICLE_FORMS[locale].includes(form.toLowerCase()), `${locale}: {${form}:${name}}`).toBe(true)
      }
    }
  })

  it.each(DICTIONARIES)('%s covers every name, line and achievement in every catalog', (_locale, dictionary) => {
    const missing = new Set<string>()
    for (const catalog of Object.values(catalogs)) {
      for (const monster of catalog.monsters) if (!(monster.name in dictionary.nouns)) missing.add(monster.name)
      for (const biome of catalog.biomes) if (!(biome.name in dictionary.nouns)) missing.add(biome.name)
      for (const gear of catalog.gearTemplates) if (!(gear.name in dictionary.nouns)) missing.add(gear.name)
      for (const effect of catalog.effects ?? []) if (!(effect.name in dictionary.text)) missing.add(effect.name)
      for (const rung of catalog.career?.rungs ?? []) if (!(rung.title in dictionary.text)) missing.add(rung.title)
    }
    for (const achievement of ACHIEVEMENTS) if (!(achievement.name in dictionary.text)) missing.add(achievement.name)
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
    const names = (line: string) => line.match(/\[\[[^\]]+\]\]/g)?.length ?? 0
    for (const [locale] of DICTIONARIES) {
      const untranslated = [...summaries].filter((summary) => contentTranslator(locale).story(summary) === null)
      expect(untranslated, `${locale} ${version}`).toEqual([])
      // D192: a name the English line marks must survive the translation (a form read as an agreement ending drops it).
      const lostNames = [...summaries].filter((summary) => names(contentTranslator(locale).story(summary) ?? '') < names(summary))
      expect(lostNames, `${locale} ${version}`).toEqual([])
    }
  })

  it('keeps the Portuguese article apart from its agreement ending (D192)', () => {
    const pt = contentTranslator('pt')
    expect(pt.story('New area unlocked: the [[Server Room]].')).toBe('Nova área desbloqueada: a [[Sala dos servidores]].')
    expect(pt.story('Walked into the glass door. -4 HP.', { heroGender: 'female' })).not.toContain('{')
  })
})
