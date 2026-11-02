/**
 * The app's own catalogs and the lookup over them.
 *
 * The bundle cannot read the dashboard's catalogs, so a missing key here is an
 * untranslated (or raw-key) string on screen in that locale. These pin the
 * fallback order, that every shipped locale covers every English key with the
 * same placeholders, and that every key the source names exists.
 */
/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'
import { CATALOGS, localeChain, t } from '../src/i18n'
import { stubLocale } from './stubs/app-sdk'

type Tree = { [key: string]: string | Tree }

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'string') out[prefix + key] = value
    else Object.assign(out, flatten(value, `${prefix}${key}.`))
  }
  return out
}

const placeholders = (text: string) => [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort()

describe('lookup order', () => {
  it('uses the exact locale first', () => {
    stubLocale('zh-CN')
    expect(t('constants.kind_figma')).toBe(flatten(CATALOGS['zh-CN'])['constants.kind_figma'])
    expect(t('constants.kind_figma')).not.toBe('Figma file')
  })

  it('falls back to the base language for a regional variant', () => {
    stubLocale('pt-BR')
    expect(localeChain('pt-BR')).toEqual(['pt', 'en'])
    expect(t('constants.kind_figma')).toBe(flatten(CATALOGS.pt)['constants.kind_figma'])
  })

  it('falls back to English for a language it does not ship', () => {
    stubLocale('sv')
    expect(localeChain('sv')).toEqual(['en'])
    expect(t('constants.kind_figma')).toBe('Figma file')
  })

  it('shows the key when no catalog has it', () => {
    expect(t('nope.not_a_key')).toBe('nope.not_a_key')
    expect(t('composer')).toBe('composer')
  })

  it('does not read inherited object properties as keys', () => {
    expect(t('constructor')).toBe('constructor')
    expect(t('composer.toString')).toBe('composer.toString')
  })

  it('fills placeholders and leaves an unsupplied one as written', () => {
    expect(t('composer.critique_this_flow_count_screens', { count: 3 })).toBe('Critique this flow · 3 screens')
    expect(t('composer.critique_this_flow_count_screens')).toBe('Critique this flow · {{count}} screens')
  })
})

describe('catalog coverage', () => {
  const english = flatten(CATALOGS.en)

  it('ships every dashboard locale', () => {
    expect(Object.keys(CATALOGS).sort()).toEqual(
      ['bn', 'de', 'en', 'es', 'fr', 'hi', 'it', 'ja', 'ko', 'pt', 'ru', 'zh-CN'].sort(),
    )
  })

  for (const [locale, catalog] of Object.entries(CATALOGS)) {
    it(`${locale} has exactly the English keys, with the same placeholders`, () => {
      const strings = flatten(catalog)
      expect(Object.keys(strings).sort()).toEqual(Object.keys(english).sort())
      for (const [key, text] of Object.entries(strings)) {
        expect(text.trim(), `${locale} ${key}`).not.toBe('')
        expect(placeholders(text), `${locale} ${key}`).toEqual(placeholders(english[key]))
      }
    })
  }

  it('has every literal key the source looks up', () => {
    const sources = import.meta.glob('../src/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true })
    const used = new Set<string>()
    for (const text of Object.values(sources) as string[]) {
      for (const m of text.matchAll(/i18nT\(\s*'([A-Za-z][\w.]*)'/g)) used.add(m[1])
    }
    expect(used.size).toBeGreaterThan(50)
    const missing = [...used].filter((key) => english[key] === undefined)
    expect(missing).toEqual([])
  })
})
