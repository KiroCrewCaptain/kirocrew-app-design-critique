/**
 * The few i18next calls the dashboard's i18n tests make, over this app's own
 * catalogs (`src/i18n.ts`), so those tests port with their assertions intact:
 * `changeLanguage` sets the host's active locale on the SDK stub (`language`
 * reads it back), `t` is the app's lookup, `getFixedT(locale)` is that lookup in
 * one language whatever the active one is, and `getResource` / `addResource`
 * read and write one catalog entry in place (a test restores what it changed).
 */
import { CATALOGS, t } from '../src/i18n'
import { activeLocale, stubLocale } from './stubs/app-sdk'

type Tree = { [key: string]: string | Tree }

function parentOf(locale: string, key: string): { node: Tree; leaf: string } | undefined {
  const parts = key.split('.')
  let node = CATALOGS[locale] as Tree | undefined
  for (const part of parts.slice(0, -1)) {
    const next: string | Tree | undefined = node?.[part]
    if (next === undefined || typeof next === 'string') return undefined
    node = next
  }
  return node ? { node, leaf: parts[parts.length - 1] } : undefined
}

export const i18next = {
  get language(): string {
    return activeLocale()
  },
  async changeLanguage(locale: string): Promise<void> {
    stubLocale(locale)
  },
  t(key: string, vars?: Record<string, unknown>): string {
    return t(key, vars as Record<string, string | number> | undefined)
  },
  getFixedT(locale: string): (key: string, vars?: Record<string, unknown>) => string {
    return (key, vars) => {
      const previous = activeLocale()
      stubLocale(locale)
      try {
        return t(key, vars as Record<string, string | number> | undefined)
      } finally {
        stubLocale(previous)
      }
    }
  },
  getResource(locale: string, _ns: 'translation', key: string): string | undefined {
    const at = parentOf(locale, key)
    const value = at ? at.node[at.leaf] : undefined
    return typeof value === 'string' ? value : undefined
  },
  addResource(locale: string, _ns: 'translation', key: string, value: string): void {
    const at = parentOf(locale, key)
    if (!at) throw new Error(`no catalog node for ${locale}:${key}`)
    at.node[at.leaf] = value
  },
}
