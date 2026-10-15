import { useState, type FormEvent } from 'react'
import { api } from '@trmnl-games/backend/api'
import { ALIAS_RULE, HERO_NAME_RULE } from '@trmnl-games/platform'
import { useIntent } from '../../../lib/intent'
import { NameField } from '../../../lib/nameField'
import { Button, Card, ErrorNote } from '../../../lib/ui'
import { useT } from '../../../lib/i18n'
import { dcMoreMessages } from '../../../i18n/dcMore'

/** Shown only when an admin has masked this player's names (D23). Progress is untouched. */
export function NameRepair() {
  const replace = useIntent(api.users.replacePublicNames)
  const [alias, setAlias] = useState('')
  const [hero, setHero] = useState('')
  const t = useT(dcMoreMessages)
  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    await replace.run({ publicAlias: alias, heroName: hero })
  }
  return (
    <Card title={t.chooseNames}>
      <p>{t.namesHidden}</p>
      <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-3">
        <NameField label={t.newPublicName} rule={ALIAS_RULE} noun="public name" value={alias} onChange={setAlias} disabled={replace.pending} />
        <NameField label={t.newHeroName} rule={HERO_NAME_RULE} noun="hero name" value={hero} onChange={setHero} disabled={replace.pending} />
        <Button type="submit" pending={replace.pending} busyLabel={t.savingNames}>
          {t.saveNames}
        </Button>
      </form>
      <ErrorNote message={replace.error} />
    </Card>
  )
}
