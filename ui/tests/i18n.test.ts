/**
 * The app's own catalogs and the lookup over them.
 *
 * The bundle cannot read the dashboard's catalogs, so a missing key here is an
 * untranslated (or raw-key) string on screen in that locale. These pin the
 * fallback order, the plural pick, that every shipped locale covers every
 * English key with the same placeholders (a counted key in every plural form
 * its language has), and that every key the source names exists.
 */
/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'
import { CATALOGS, fmtNumber, localeChain, t } from '../src/i18n'
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
    expect(t('composer.step_n', { n: 3 })).toBe('Step 3')
    expect(t('composer.step_n')).toBe('Step {{n}}')
  })
})

describe('plural pick', () => {
  it('reads the form for the count in English', () => {
    expect(t('composer.critique_this_flow_count_screens', { count: 1 })).toBe('Critique this flow · 1 screen')
    expect(t('composer.critique_this_flow_count_screens', { count: 3 })).toBe('Critique this flow · 3 screens')
    expect(t('composer.critique_this_flow_count_screens', { count: 0 })).toBe('Critique this flow · 0 screens')
  })

  it('uses the active language\'s own categories', () => {
    stubLocale('ru')
    const ru = flatten(CATALOGS.ru)
    expect(t('designCritiquePage.findings_count', { count: 1, n: '1' })).toBe(ru['designCritiquePage.findings_count_one'].replace('{{n}}', '1'))
    expect(t('designCritiquePage.findings_count', { count: 3, n: '3' })).toBe(ru['designCritiquePage.findings_count_few'].replace('{{n}}', '3'))
    expect(t('designCritiquePage.findings_count', { count: 5, n: '5' })).toBe(ru['designCritiquePage.findings_count_many'].replace('{{n}}', '5'))
    stubLocale('ja')
    expect(t('designCritiquePage.findings_count', { count: 1, n: '1' })).toBe(flatten(CATALOGS.ja)['designCritiquePage.findings_count_other'].replace('{{n}}', '1'))
  })

  it('leaves a key whose name ends in a category alone without a count', () => {
    expect(t('waitingScreen.title_uploading_one')).toBe('Uploading your screenshot…')
  })

  it('formats a number in the active language', () => {
    stubLocale('en')
    expect(fmtNumber(1234)).toBe('1,234')
    stubLocale('bn')
    expect(fmtNumber(3)).toBe(new Intl.NumberFormat('bn').format(3))
    expect(fmtNumber(Number.NaN)).toBe('—')
  })
})

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/

/** A counted key's base name: one whose English catalog has a `_other` form. */
function baseOf(key: string, english: Record<string, string>): string {
  const m = PLURAL_SUFFIX.exec(key)
  if (!m) return key
  const base = key.slice(0, -m[0].length)
  return english[base + '_other'] !== undefined ? base : key
}

describe('catalog coverage', () => {
  const english = flatten(CATALOGS.en)
  const englishBases = [...new Set(Object.keys(english).map((key) => baseOf(key, english)))].sort()
  const counted = englishBases.filter((base) => english[base] === undefined && english[base + '_other'] !== undefined)

  it('ships every dashboard locale', () => {
    expect(Object.keys(CATALOGS).sort()).toEqual(
      ['bn', 'de', 'en', 'es', 'fr', 'hi', 'it', 'ja', 'ko', 'pt', 'ru', 'zh-CN'].sort(),
    )
  })

  for (const [locale, catalog] of Object.entries(CATALOGS)) {
    it(`${locale} has exactly the English keys, with the same placeholders`, () => {
      const strings = flatten(catalog)
      const bases = [...new Set(Object.keys(strings).map((key) => baseOf(key, english)))].sort()
      expect(bases).toEqual(englishBases)
      const categories = new Intl.PluralRules(locale).resolvedOptions().pluralCategories
      for (const base of counted) {
        for (const category of categories) {
          expect(strings[`${base}_${category}`], `${locale} ${base}_${category}`).toBeDefined()
        }
      }
      for (const [key, text] of Object.entries(strings)) {
        const base = baseOf(key, english)
        const reference = english[key] ?? english[base + '_other']
        expect(text.trim(), `${locale} ${key}`).not.toBe('')
        expect(placeholders(text), `${locale} ${key}`).toEqual(placeholders(reference))
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
    const missing = [...used].filter((key) => english[key] === undefined && english[key + '_other'] === undefined)
    expect(missing).toEqual([])
  })
})
