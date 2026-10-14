import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { useIntent } from '../../../lib/intent'
import { preload } from '../../../lib/preload'
import type { LifeView } from '../../../lib/paperLives'
import { ActionFeedback, Button, Card, NoticeBar, useNotice } from '../../../lib/ui'
import { ConfirmSheet, Consequences } from '../desk-crawler/-confirm'

/** The More tab: rankings, achievements and help, then settings (pause, public profile, deleting Paper Lives progress alone). */
export const Route = createFileRoute('/app/paper-lives/settings')({
  loader: ({ context }) => preload(context, convexQuery(api.paperLives.lives.view, {})),
  component: SettingsPage,
})

const MORE_LINKS = [
  { to: '/app/paper-lives/rankings', label: 'Rankings', blurb: 'The longest lives and the biggest fortunes, this week and all time.' },
  { to: '/app/paper-lives/achievements', label: 'Achievements', blurb: 'Every tier earned across your lives, and what comes next.' },
  { to: '/help/paper-lives', label: 'How Paper Lives works', blurb: 'Years, decisions, the stats and the next life.' },
] as const

function SettingsPage() {
  const { notice, notify, dismiss } = useNotice()
  const { data } = useQuery(convexQuery(api.paperLives.lives.view, {}))
  const view = data as LifeView | undefined
  const pause = useIntent(api.paperLives.lives.pause)
  const resume = useIntent(api.paperLives.lives.resume)
  const profile = useIntent(api.paperLives.lives.setPublicProfile)
  const deletion = useIntent(api.deletion.requestGameDeletion)
  const [confirm, setConfirm] = useState('')
  const [askingPause, setAskingPause] = useState(false)
  const life = view?.life
  if (!life) return null
  const active = life.activationState === 'active'
  return (
    <>
      <h1 className="font-display text-3xl font-bold">More</h1>
      <Card>
        <ul className="flex flex-col">
          {MORE_LINKS.map((link) => (
            <li key={link.to} className="border-b border-rule last:border-b-0">
              <Link to={link.to} className="flex min-h-12 flex-col justify-center py-2">
                <span className="font-semibold underline underline-offset-4">{link.label}</span>
                <span className="text-sm text-muted">{link.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <h2 className="font-display text-2xl font-bold">Settings</h2>
      {active && life.status !== 'ended' ? (
        <Card title="Pause">
          <p>{life.status === 'paused' ? 'The life is paused. No years pass until you resume, and the year picks up where it stopped.' : 'Years pass every few hours, day and night, whether or not you look in.'}</p>
          <div className="mt-3">
            {life.status === 'paused'
              ? <Button pending={resume.pending} onClick={() => void resume.run({}, 'The life goes on.')}>Resume</Button>
              : <Button variant="secondary" disabled={pause.pending} onClick={() => setAskingPause(true)}>Pause this life</Button>}
          </div>
          <ActionFeedback error={pause.error ?? resume.error} message={pause.message ?? resume.message} />
        </Card>
      ) : null}
      {active ? (
        <Card title="Public profile">
          <p>{life.publicProfile ? 'Your current life and your finished lives show on your public profile.' : 'Paper Lives is hidden from your public profile.'} The boards always show your public name.</p>
          <div className="mt-3">
            <Button variant={life.publicProfile ? 'quiet' : 'secondary'} pending={profile.pending} onClick={() => void profile.run({ visible: !life.publicProfile }, life.publicProfile ? 'Paper Lives is hidden from your profile.' : 'Paper Lives now shows on your profile.')}>
              {life.publicProfile ? 'Hide from my profile' : 'Show on my profile'}
            </Button>
          </div>
          <ActionFeedback error={profile.error} message={profile.message} />
        </Card>
      ) : null}
      <Card title="Delete Paper Lives progress">
        <p>This removes the current life, every finished life in the album and your Paper Lives connections. Your TRMNL Games account and your other games stay. It cannot be undone.</p>
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-sm font-semibold">Type DELETE to confirm</span>
          <input value={confirm} onChange={(event) => setConfirm(event.target.value)} className="min-h-11 border-2 border-edge bg-ground px-3 text-base" autoComplete="off" />
        </label>
        <div className="mt-3">
          <Button variant="danger" disabled={confirm !== 'DELETE'} pending={deletion.pending} onClick={() => void deletion.run({ confirm: 'DELETE', gameSlug: 'paper-lives' }, 'Removing Paper Lives progress.')}>Delete Paper Lives progress</Button>
        </div>
        <ActionFeedback error={deletion.error} message={deletion.message} />
      </Card>
      <p className="text-sm"><Link to="/account" className="underline underline-offset-4">Account settings</Link> cover your public name, analytics and deleting your whole account.</p>
      <ConfirmSheet
        open={askingPause}
        title="Pause this life?"
        confirmLabel="Pause"
        busyLabel="Pausing…"
        cancelLabel="Keep living"
        pending={pause.pending}
        onClose={() => setAskingPause(false)}
        onConfirm={async () => {
          if (pause.pending) return
          await pause.run({}, 'Life paused.')
          setAskingPause(false)
        }}
      >
        <Consequences>
          <li>No years pass and nothing happens until you resume.</li>
          <li>The year keeps its place, and any open decision waits.</li>
          <li>Resume any time from this page.</li>
        </Consequences>
      </ConfirmSheet>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}
