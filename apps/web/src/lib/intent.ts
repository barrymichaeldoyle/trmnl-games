import { ConvexError } from 'convex/values'
import { useMutation } from 'convex/react'
import type { OptimisticUpdate } from 'convex/browser'
import type { FunctionReference } from 'convex/server'
import { useRef, useState } from 'react'
import { ExpiredSubmission, Submission } from './submission'
import { getFunctionName } from 'convex/server'
import { captureAnalytics, intentAnalytics } from './analytics'
import { reportError } from './errorReporting'
import { documentLocale } from './i18n'
import { serverMessage } from '../i18n/serverMessages'

/** User-safe message from a structured Convex error (api.md error contract). */
export function errorMessage(error: unknown): string {
  return serverMessage(englishErrorMessage(error), documentLocale())
}

export function isRefusal(value: unknown): value is { ok: false; code: string; message: string } {
  return typeof value === 'object' && value !== null && 'ok' in value && (value as { ok?: unknown }).ok === false && 'message' in value && 'code' in value
}

function englishErrorMessage(error: unknown): string {
  if (error instanceof ExpiredSubmission) return error.message
  if (error instanceof ConvexError && typeof error.data === 'object' && error.data !== null && 'message' in error.data) {
    return String((error.data as { message: unknown }).message)
  }
  return 'We could not confirm that action. Check your connection, then try the same action again.'
}

/**
 * Run a state-changing intent with a fresh operation ID per action, a pending
 * flag that blocks double clicks, and a readable error. A preference the server
 * only stores (a switch, the stance, profile visibility) passes `optimisticUpdate`
 * so the page changes on the tap; Convex rolls it back if the intent fails.
 * Gains and spends never do: the server decides those.
 */
export function useIntent<Args extends { operationId: string }>(fn: FunctionReference<'mutation', 'public', Args>, options: { onFeedback?: (feedback: { error: string | null; message: string | null }) => void; optimisticUpdate?: OptimisticUpdate<Args> } = {}) {
  const base = useMutation(fn)
  const mutate = options.optimisticUpdate ? base.withOptimisticUpdate(options.optimisticUpdate) : base
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submission] = useState(() => new Submission())
  const inFlight = useRef(false)
  const onFeedback = useRef(options.onFeedback)
  onFeedback.current = options.onFeedback
  const fail = (text: string) => { setError(text); onFeedback.current?.({ error: text, message: null }) }
  // successMessage may read the result, for a mutation whose answer is an outcome rather than a refusal (a fly code that
  // does not match); returning { error } shows that line as the failure and run resolves false.
  async function run(args: Omit<Args, 'operationId'>, successMessage: string | ((done: never) => string | { error: string }) = 'Done. Your TRMNL will reflect this on its next refresh.'): Promise<boolean> {
    if (inFlight.current) return false
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      fail(serverMessage('You are offline. Reconnect, then try again. No action was queued.', documentLocale()))
      return false
    }
    inFlight.current = true
    setPending(true)
    setError(null)
    setMessage(null)
    try {
      const done = await submission.run(args, (input) => (mutate as unknown as (input: Args) => Promise<unknown>)(input as Args), (error) => error instanceof ConvexError)
      if (isRefusal(done)) {
        captureAnalytics('intent failed', { intent: getFunctionName(fn), error_code: done.code })
        fail(serverMessage(done.message, documentLocale()))
        return false
      }
      if (done) {
        const said = typeof successMessage === 'function' ? successMessage(done as never) : successMessage
        if (typeof said !== 'string') { fail(said.error); return false }
        const success = intentAnalytics(getFunctionName(fn), args as Record<string, unknown>)
        if (success) captureAnalytics(...success)
        // Callers pass their own success line already in the reader's language; the default one is translated here.
        const shown = serverMessage(said, documentLocale())
        setMessage(shown)
        onFeedback.current?.({ error: null, message: shown })
      }
      return Boolean(done)
    } catch (caught) {
      const code = caught instanceof ConvexError && caught.data && typeof caught.data === 'object' && 'code' in caught.data ? String(caught.data.code) : caught instanceof ExpiredSubmission ? 'SUBMISSION_EXPIRED' : 'UNKNOWN'
      captureAnalytics('intent failed', { intent: getFunctionName(fn), error_code: code })
      if (!(caught instanceof ConvexError) && !(caught instanceof ExpiredSubmission)) reportError(caught, 'intent')
      fail(errorMessage(caught))
      return false
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }
  return { run, pending, error, message, clearError: () => setError(null), clearFeedback: () => { setError(null); setMessage(null) } }
}

export const artUrl = (path: string) => `${import.meta.env.VITE_CONVEX_SITE_URL ?? ''}${path}`
