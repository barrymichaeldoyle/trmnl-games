import { useId } from 'react'
import { useT } from './i18n'
import { commonMessages } from '../i18n/common'

export type HeroGender = 'male' | 'female'
export const GENDERS: readonly HeroGender[] = ['male', 'female']

/**
 * D149: the hero's gender as one segmented row, like the stance control. Purely cosmetic. With `name`, a hidden input
 * carries the choice in a plain form's data.
 */
export function GenderPicker({ value, onChange, note, name, disabled, small = false }: { value: HeroGender; onChange: (value: HeroGender) => void; note?: string; name?: string; disabled?: boolean; small?: boolean }) {
  const id = useId()
  const t = useT(commonMessages)
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span id={`${id}-label`} className={`font-semibold ${small ? 'text-sm' : ''}`}>{t.gender}</span>
      {note ? <span id={`${id}-note`} className="text-sm text-muted">{note}</span> : null}
      <div role="group" aria-labelledby={`${id}-label`} aria-describedby={note ? `${id}-note` : undefined} className="flex border-2 border-edge">
        {GENDERS.map((option) => {
          const chosen = option === value
          return (
            <button key={option} type="button" aria-pressed={chosen} disabled={disabled} onClick={() => onChange(option)} className={`menu-cursor flex min-h-11 flex-1 items-center justify-center px-2 py-2 label-px uppercase tracking-wide not-last:border-r-2 not-last:border-edge not-aria-pressed:before:hidden ${chosen ? 'bg-navy text-gold' : 'text-muted hover:bg-rule hover:text-ink active:bg-rule active:text-ink disabled:text-muted'}`}>
              {t.genders[option]}
            </button>
          )
        })}
      </div>
      {name ? <input type="hidden" name={name} value={value} /> : null}
    </div>
  )
}
