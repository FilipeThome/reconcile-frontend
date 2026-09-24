import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getLocale, setLocale as storeLocale, subscribeLocale, t, type AppLocale, type MessageKey } from '../i18n/locale'

type LocaleValue = {
  locale: AppLocale
  setLocale: (next: AppLocale) => void
  t: (key: MessageKey, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(getLocale())

  useEffect(() => {
    return subscribeLocale(() => setLocaleState(getLocale()))
  }, [])

  const value = useMemo<LocaleValue>(
    () => ({
      locale,
      setLocale: storeLocale,
      t,
    }),
    [locale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used within LocaleProvider')
  return context
}

export function LanguageSwitch() {
  const { locale, setLocale, t } = useLocale()
  return (
    <div className="lang-switch" role="group" aria-label={t('set.language')}>
      <button type="button" className={locale === 'pt-BR' ? 'on' : ''} onClick={() => setLocale('pt-BR')}>
        {t('lang.pt')}
      </button>
      <button type="button" className={locale === 'en-US' ? 'on' : ''} onClick={() => setLocale('en-US')}>
        {t('lang.en')}
      </button>
    </div>
  )
}
