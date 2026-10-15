import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import { useT } from './i18n'
import { commonMessages } from '../i18n/common'

const OnlineContext = createContext(true)
const subscribe = (notify: () => void) => {
  window.addEventListener('online', notify)
  window.addEventListener('offline', notify)
  return () => {
    window.removeEventListener('online', notify)
    window.removeEventListener('offline', notify)
  }
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  return <OnlineContext.Provider value={online}>{children}</OnlineContext.Provider>
}

export const useOnline = () => useContext(OnlineContext)

export function OfflineNote() {
  const online = useOnline()
  const t = useT(commonMessages)
  return online ? null : (
    <p role="status" className="border-b border-rule px-4 py-3 text-center text-sm">
      {t.offline}
    </p>
  )
}
