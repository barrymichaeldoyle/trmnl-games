import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cleanName, disallowedCharacters, validateName, type NameRule } from '@trmnl-games/platform'
import { ErrorNote } from './ui'

const HIDDEN = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u

function characterList(characters: string[]): string {
  const shown = characters.slice(0, 3).map((character) => (HIDDEN.test(character) ? 'a hidden character' : `“${character}”`))
  return shown.length > 1 ? `${shown.slice(0, -1).join(', ')} and ${shown.at(-1)}` : shown[0]!
}

/** The nearest name the rule allows: accents dropped, anything else refused left out. */
function nearestName(value: string): string {
  return cleanName(cleanName(value).normalize('NFD').replace(/\p{M}/gu, '').replace(/[^A-Za-z0-9 ._'-]/g, ''))
}

/** What is wrong with a name under the server's rule, or null when the server will take it. */
export function nameProblem(value: string, rule: NameRule, noun: string): string | null {
  const bad = disallowedCharacters(value)
  if (bad.length > 0) {
    const nearest = nearestName(value)
    const suggestion = nearest !== '' && validateName(nearest, rule).ok ? ` Try “${nearest}”.` : ''
    return `${characterList(bad)} can’t go in a ${noun}.${suggestion}`
  }
  const length = [...cleanName(value)].length
  if (length === 0) return `Enter a ${noun}.`
  if (length < rule.min) return `Use at least ${rule.min} characters.`
  if (length > rule.max) return `Use at most ${rule.max} characters.`
  return null
}

/**
 * A public-name or hero-name input that checks the server's rule as you type, so a name the server would refuse never
 * leaves the browser. A character the rule refuses shows at once; a short name waits until you leave the field or
 * submit. The form cannot submit while the name has a problem, and the browser's own bubble is replaced by the note.
 */
export function NameField({ label, note, rule, noun, value, onChange, name, disabled, placeholder, small = false }: {
  label: ReactNode
  note?: ReactNode
  rule: NameRule
  noun: string
  value: string
  onChange: (value: string) => void
  name?: string
  disabled?: boolean
  placeholder?: string
  small?: boolean
}) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [touched, setTouched] = useState(false)
  const problem = nameProblem(value, rule, noun)
  const shown = problem !== null && (touched || disallowedCharacters(value).length > 0) ? problem : null
  useEffect(() => { input.current?.setCustomValidity(problem ?? '') }, [problem])
  const described = [note ? `${id}-note` : null, `${id}-rule`, shown ? `${id}-error` : null].filter(Boolean).join(' ')
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className={`font-semibold ${small ? 'text-sm' : ''}`}>{label}</label>
      {note ? <span id={`${id}-note`} className="text-sm text-muted">{note}</span> : null}
      <span id={`${id}-rule`} className="text-sm text-muted">{rule.min} to {rule.max} characters: letters A-Z, numbers, spaces and . _ ' -</span>
      <input
        ref={input}
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => { if (value !== '') setTouched(true) }}
        onInvalid={(event) => {
          // Show the note instead of the browser's bubble, and focus the first field with a problem.
          event.preventDefault()
          setTouched(true)
          if (!document.activeElement?.matches(':invalid')) event.currentTarget.focus()
        }}
        required
        maxLength={rule.max}
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={shown ? true : undefined}
        aria-describedby={described}
        className={`min-h-11 min-w-0 border-2 bg-ground px-3 text-base ${shown ? 'border-hp' : 'border-edge'}`}
      />
      <ErrorNote id={`${id}-error`} message={shown} />
    </div>
  )
}
