import { describe, expect, it } from 'vitest'
import { ACTIVE_CONTENT, catalogs } from '@trmnl-games/desk-crawler/content'
import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID } from '@trmnl-games/desk-crawler/content/achievements'
import { achievementGoal, goalText } from '@trmnl-games/desk-crawler/content/achievementGoals'
import { contentTranslator } from '@trmnl-games/desk-crawler/i18n'

const LOCALES = ['fr', 'de', 'es', 'it', 'pt', 'pl', 'nl'] as const
const content = catalogs[ACTIVE_CONTENT]
const goal = (id: string) => achievementGoal(ACHIEVEMENT_BY_ID.get(id)!, content)
const en = { text: (s: string) => s }
const shown = (id: string, locale?: (typeof LOCALES)[number]) => goalText(goal(id), locale ? contentTranslator(locale) : en)

describe('achievement goals (D241)', () => {
  it('says in plain words what each badge asks for', () => {
    expect(shown('slay_paper_imp_1')).toBe('Defeat a Paper Imp')
    expect(shown('slay_paper_imp_3')).toBe('Defeat 25 Paper Imps')
    expect(shown('slay_overheated_rack_1')).toBe('Defeat an Overheated Rack')
    expect(shown('adventures_5')).toBe('Go on 10,000 adventures')
    expect(shown('gold_4')).toBe('Earn 100,000 gold in total')
    expect(shown('levels_3')).toBe('Reach level 12')
    expect(shown('bags_2')).toBe('Own a bag with 13 slots')
    expect(shown('floor_cleared_2')).toBe('Defeat 25 of each monster in the Server Room')
    expect(shown('rogue_1')).toBe('Recruit a Rogue')
    expect(shown('rogue_2')).toBe('Reach level 7 with your Rogue')
    expect(shown('rogue_gold_1')).toBe('Earn 1,000 gold with your Rogue')
  })

  it('has a goal for every achievement, with no marks or unfilled variables', () => {
    for (const def of ACHIEVEMENTS) {
      const line = achievementGoal(def, content)
      expect(line, def.id).not.toMatch(/[{}]/)
      expect(line.length, def.id).toBeGreaterThan(5)
    }
  })

  it.each(LOCALES)('%s translates every goal whole', (locale) => {
    const c = contentTranslator(locale)
    for (const def of ACHIEVEMENTS) {
      const english = achievementGoal(def, content)
      const shown = goalText(english, c)
      expect(shown, `${locale} ${def.id}: ${english}`).not.toBe(goalText(english, en))
      expect(shown, `${locale} ${def.id}`).not.toMatch(/[{}[\]]|with your|Rogue\b| times\b| gold\b/)
    }
  })

  it('keeps the longer Rogue lines apart from the plain ones', () => {
    expect(shown('rogue_2', 'de')).toBe('Erreiche mit deinem Schurken Stufe 7')
    expect(shown('levels_2', 'de')).toBe('Erreiche Stufe 8')
    expect(shown('slay_paper_imp_3', 'de')).toBe('Besiege 25 Papierkobolde')
    expect(shown('adventures_5', 'fr')).toBe('Vivre 10 000 aventures')
  })
})
