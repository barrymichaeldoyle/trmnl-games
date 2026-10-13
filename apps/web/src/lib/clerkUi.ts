import type { ClerkProvider } from '@clerk/tanstack-react-start'
import type { ComponentProps } from 'react'

/**
 * Clerk's prebuilt UI (sign-in, sign-up, the account menu and profile) on demand (D137).
 *
 * By default ClerkProvider downloads `@clerk/ui` (about 220 KB) on every page as soon as Clerk loads, so a visitor who
 * never signs in pays for the sign-in modal. Clerk reaches its UI only through `ensureMounted()` on the instance it
 * builds from `ui.ClerkUI` (clerk-js awaits that call before every modal and every mounted component). LazyClerkUI is
 * handed over in its place: Clerk itself still loads at once, so sessions and `<Show>` are unaffected, and the first
 * `ensureMounted()` (a Sign in press, an embedded `<SignIn>`, or the signed-in avatar mounting) downloads the real UI
 * from the same URL Clerk would use and forwards to it. Sign-in buttons call `preloadClerkUI()` on hover, focus or touch
 * so the modal is usually ready by the click. tests/web/clerk-ui.test.ts checks the URL against Clerk's own loader.
 */

/** The `@clerk/ui` major the installed Clerk SDK pins (its versionSelector default); the CDN serves its latest release. */
const CLERK_UI_MAJOR = '1'

/** Clerk's own types for the UI constructor, read from the provider's `ui` option. */
type UiConstructor = Exclude<NonNullable<NonNullable<ComponentProps<typeof ClerkProvider>['ui']>['ClerkUI']>, Promise<unknown>>
type UiArgs = ConstructorParameters<UiConstructor>
type UiInstance = InstanceType<UiConstructor>
/** The global Clerk's CDN script defines its UI constructor on. */
const loadedUi = (): UiConstructor | undefined => (window as unknown as { __internal_ClerkUICtor?: UiConstructor }).__internal_ClerkUICtor

/** Clerk's frontend API host from a publishable key: `pk_live_` or `pk_test_`, then the host in base64 ending in `$`. */
export function clerkFrontendHost(publishableKey: string | undefined): string | null {
  try {
    const host = atob(String(publishableKey ?? '').split('_')[2] ?? '').replace(/\$$/, '')
    return /^[a-z0-9.-]+$/i.test(host) ? host : null
  } catch {
    return null
  }
}

/** Where Clerk loads its UI from for this key, as `@clerk/shared`'s clerkUIScriptUrl builds it without a proxy. */
export function clerkUiScriptUrl(publishableKey: string | undefined): string | null {
  const host = clerkFrontendHost(publishableKey)
  return host ? `https://${host}/npm/@clerk/ui@${CLERK_UI_MAJOR}/dist/ui.browser.js` : null
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
let loading: Promise<UiConstructor> | undefined

/** Downloads Clerk's UI once; a failed download can be retried by the next call. */
function preloadClerkUI(): Promise<UiConstructor> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Clerk UI only loads in the browser'))
  loading ??= new Promise<UiConstructor>((resolve, reject) => {
    const ready = loadedUi()
    if (ready) return resolve(ready)
    const url = clerkUiScriptUrl(PUBLISHABLE_KEY)
    if (!url) return reject(new Error('Clerk UI has no publishable key to load from'))
    const script = document.createElement('script')
    script.src = url
    script.async = true
    script.crossOrigin = 'anonymous'
    script.setAttribute('data-clerk-ui-script', '')
    if (PUBLISHABLE_KEY) script.setAttribute('data-clerk-publishable-key', PUBLISHABLE_KEY)
    script.onload = () => {
      const ui = loadedUi()
      if (ui) resolve(ui)
      else reject(new Error('Clerk UI loaded without its constructor'))
    }
    script.onerror = () => reject(new Error('Failed to load Clerk UI'))
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    loading = undefined
    document.querySelector('script[data-clerk-ui-script]')?.remove()
    throw error
  })
  return loading
}

/** Stands in for `@clerk/ui`'s constructor until Clerk first needs a component; see the file comment. */
export class LazyClerkUI {
  static get version(): string {
    return (typeof window === 'undefined' ? undefined : loadedUi()?.version) ?? ''
  }

  readonly #args: UiArgs
  #ui: Promise<UiInstance> | undefined

  constructor(...args: UiArgs) {
    this.#args = args
  }

  get version(): string {
    return LazyClerkUI.version
  }

  /**
   * Clerk asks for its component controls before every UI action. With a component named (`preloadHint`) or the UI
   * already here, the real UI is loaded and asked. Without one, before the UI has loaded, nothing is on screen: Clerk
   * makes that call right after load to pass new provider options (`updateProps`), and for closes and unmounts. Those get
   * stand-in controls that remember the newest props for the real UI and do nothing else, so loading a page downloads
   * no UI. Any other action on the stand-in loads the real UI and is forwarded to it.
   */
  ensureMounted(opts?: { preloadHint?: string }): ReturnType<UiInstance['ensureMounted']> {
    if (this.#ui || opts?.preloadHint) return this.#real(opts)
    const deferred = new Proxy({}, {
      get: (_target, name) => {
        // Not a thenable, so the promise below resolves to this object rather than trying to unwrap it.
        if (name === 'then' || typeof name !== 'string') return undefined
        if (name === 'updateProps') return (...args: unknown[]) => { this.#pendingProps = args }
        if (/^(close|unmount)/.test(name)) return () => undefined
        return (...args: unknown[]) => this.#real().then((controls) => (controls as Record<string, (...a: unknown[]) => unknown>)[name]!(...args))
      },
    })
    return Promise.resolve(deferred) as ReturnType<UiInstance['ensureMounted']>
  }

  #pendingProps: unknown[] | undefined

  #real(opts?: { preloadHint?: string }): ReturnType<UiInstance['ensureMounted']> {
    this.#ui ??= preloadClerkUI().then((Real) => new Real(...this.#args)).catch((error: unknown) => {
      this.#ui = undefined
      throw error
    })
    return this.#ui.then((ui) => ui.ensureMounted(opts)).then((controls) => {
      const pending = this.#pendingProps
      this.#pendingProps = undefined
      if (pending) (controls as unknown as { updateProps: (...a: unknown[]) => unknown }).updateProps(...pending)
      return controls
    })
  }
}

/** Props for a sign-in or sign-up trigger: start the download when the pointer or focus arrives, before the click. */
export const PRELOAD_CLERK_UI = { onPointerEnter: () => void preloadClerkUI().catch(() => {}), onFocus: () => void preloadClerkUI().catch(() => {}), onTouchStart: () => void preloadClerkUI().catch(() => {}) }
