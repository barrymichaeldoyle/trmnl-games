import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { useMutation } from 'convex/react'
import { ConvexError } from 'convex/values'
import { useRef, useState, type FormEvent } from 'react'
import { api } from '@trmnl-games/backend/api'
import { captureAnalytics } from '../../../lib/analytics'
import { errorMessage } from '../../../lib/intent'
import { LocalTime } from '../../../lib/localTime'
import { useOnline } from '../../../lib/network'
import { Photos, type PhotoView } from '../../../lib/paperLives'
import { Submission } from '../../../lib/submission'
import { ActionFeedback, Button, Card } from '../../../lib/ui'

type Book = { totalCollected: number; claimedThisWeek: boolean; nextAvailableAt: number | null; connected: boolean; living: boolean; photos: PhotoView[] } | null

const weekday = (date: Date) => date.toLocaleDateString([], { weekday: 'long' })

/**
 * The photo album's weekly claim (L6): enter the code your TRMNL shows to take a photo of the character as they are
 * now. The outcome decides the message, as Desk Crawler's keepsakes do, so a wrong code says so.
 */
export function PhotoClaim({ name }: { name: string }) {
  const { data } = useQuery(convexQuery(api.paperLives.photos.mine, {}))
  const book = data as Book | undefined
  const mutate = useMutation(api.paperLives.photos.claim)
  const online = useOnline()
  const submission = useRef(new Submission())
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  if (!book) return null

  const edit = (value: string) => { setCode(value); setError(null); setMessage(null) }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (pending) return
    setError(null)
    setMessage(null)
    if (!online) { setError('You are offline. Reconnect, then try again.'); return }
    const normalized = code.replace(/[\s-]/g, '')
    if (!/^\d{6}$/.test(normalized)) { setError('Enter the six-digit code shown beside “Photo code” on your TRMNL.'); return }
    setPending(true)
    try {
      await submission.current.run({ code: normalized }, async (input) => {
        const result = await mutate(input)
        if (result.outcome === 'invalid_code') setError('That code doesn’t match your TRMNL connection. Check the digits on your screen, or wait for its next refresh.')
        else if (result.outcome === 'already_claimed') setMessage('This week’s photo is already in the album.')
        else {
          setMessage(`Photo taken. ${name} is in the album at this age now.`)
          setCode('')
          captureAnalytics('photo taken', { total: result.totalCollected })
        }
      }, (caught) => caught instanceof ConvexError)
    } catch (caught) { setError(errorMessage(caught)) }
    finally { setPending(false) }
  }

  return (
    <Card title="Photos">
      <p>Each week your TRMNL shows a <strong>Photo code</strong> in its title bar. Enter it to take a photo of {name} as they are this week. Photos stay in the album after the life ends.</p>
      {!book.living ? (
        <p className="mt-3 text-sm text-muted">Begin the next life to take this week’s photo.</p>
      ) : book.claimedThisWeek ? (
        <p className="mt-3 text-sm font-semibold">This week’s photo is in the album. A new code appears on {book.nextAvailableAt ? <LocalTime at={book.nextAvailableAt} format={weekday} /> : null}.</p>
      ) : book.connected ? (
        <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Photo code</span>
            <input value={code} onChange={(event) => edit(event.target.value)} inputMode="numeric" autoComplete="off" placeholder="482 917" className="min-h-11 w-36 border-2 border-edge bg-ground px-3 text-base tracking-widest" />
          </label>
          <Button type="submit" disabled={code.replace(/\s/g, '').length !== 6} pending={pending} busyLabel="Checking…">Take the photo</Button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted">Connect a TRMNL with Paper Lives to see this week’s code.</p>
      )}
      <ActionFeedback error={error} message={message} />
      {book.photos.length > 0 ? <div className="mt-4"><Photos photos={book.photos} label={`Photos of ${name}`} /></div> : null}
    </Card>
  )
}
