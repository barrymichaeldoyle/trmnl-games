import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { ALIAS_RULE, HERO_NAME_RULE, validateName } from '@trmnl-games/platform'
import { NameField, nameProblem } from '../../apps/web/src/lib/nameField'

it('agrees with the server on every name it lets through or stops', () => {
  for (const raw of ['Barry', ' Bo ', 'B', 'Zoë', 'ana@home', 'Ünal ✨', 'Dr. O\'Neil-Smith', 'a'.repeat(21), 'tab\there', 'zero\u200Bwidth', '']) {
    expect(nameProblem(raw, ALIAS_RULE, 'public name') === null, raw).toBe(validateName(raw, ALIAS_RULE).ok)
    expect(nameProblem(raw, HERO_NAME_RULE, 'hero name') === null, raw).toBe(validateName(raw, HERO_NAME_RULE).ok)
  }
})

it('names the characters it refuses, once each, and calls invisible ones hidden', () => {
  expect(nameProblem('Zoë Ünal', ALIAS_RULE, 'public name')).toBe('“ë” and “Ü” can’t go in a public name. Try “Zoe Unal”.')
  expect(nameProblem('a@b@c!', ALIAS_RULE, 'public name')).toBe('“@” and “!” can’t go in a public name. Try “abc”.')
  expect(nameProblem('zero\u200Bwidth', HERO_NAME_RULE, 'hero name')).toBe('a hidden character can’t go in a hero name. Try “zerowidth”.')
  expect(nameProblem('✨✨', HERO_NAME_RULE, 'hero name')).toBe('“✨” can’t go in a hero name.')
  expect(nameProblem('', HERO_NAME_RULE, 'hero name')).toBe('Enter a hero name.')
  expect(nameProblem('B', ALIAS_RULE, 'public name')).toBe('Use at least 2 characters.')
})

it('shows a refused character at once, tied to the input, and states the rule up front', () => {
  const markup = renderToStaticMarkup(createElement(NameField, { label: 'Public name', rule: ALIAS_RULE, noun: 'public name', value: 'Zoë', onChange: () => {} }))
  expect(markup).toContain('aria-invalid="true"')
  expect(markup).toContain('role="alert"')
  expect(markup).toContain('2 to 20 characters')
  const errorId = /<p id="([^"]+)" role="alert"/.exec(markup)?.[1]
  expect(errorId).toBeTruthy()
  expect(/aria-describedby="([^"]+)"/.exec(markup)?.[1]?.split(' ')).toContain(errorId)
})

it('waits for the player to finish before flagging a short name', () => {
  const markup = renderToStaticMarkup(createElement(NameField, { label: 'Hero name', rule: HERO_NAME_RULE, noun: 'hero name', value: 'B', onChange: () => {} }))
  expect(markup).not.toContain('aria-invalid')
  expect(markup).not.toContain('role="alert"')
})
