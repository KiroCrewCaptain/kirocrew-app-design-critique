/**
 * A critique's failure and status lines read in the user's language.
 *
 * Six error sentences were `new Error('...')` literals in `DesignCritiquePage.tsx`
 * and `api.ts`, and the page shows a thrown error's message as it is, so a
 * German or Russian user read English when a critique failed. Several catalog
 * entries (the "didn't finish", "still working", start-button and picker lines)
 * also shipped the English source in all 11 other languages.
 *
 * The render tests run a real critique in Russian on fake timers, as the page's
 * coverage file does, and read the line a user would read; each expected value
 * comes from the catalog and is checked against English first. The catalog test
 * fails on any sentence a non-English catalog still ships verbatim in English.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

import { designCritiqueApi } from '../src/api'
import { CATALOGS } from '../src/i18n'
import { i18next } from './i18nTestKit'
import { sourceText } from './sourceText'

vi.mock('../src/api', () => ({
  designCritiqueApi: {
    openSlot: vi.fn(), getSlot: vi.fn(), send: vi.fn(), deleteSlot: vi.fn(), uploadFiles: vi.fn(),
    discover: vi.fn(), render: vi.fn(), pollDiscover: vi.fn(), pollRender: vi.fn(), method: vi.fn(),
  },
  fileUrl: (p: string) => '/api/file-raw?path=' + encodeURIComponent(p),
}))

const mockApi = designCritiqueApi as unknown as Record<string, Mock>

const DesignCritiquePage = (await import('../src/DesignCritiquePage')).default

const LANGUAGES = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'ko', 'zh-CN', 'hi', 'bn']

/** The `lng` value of `key`, guarded so a missing translation fails here. */
function tr(lng: string, key: string): string {
  const en = i18next.getFixedT('en')(key)
  const value = i18next.getFixedT(lng)(key)
  expect(value).not.toBe(en)
  expect(value).not.toBe(key)
  return value
}

async function tick(ms = 0): Promise<void> {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms) })
}

/** One poll cycle is a 1500ms sleep followed by a slot read. */
const POLL_MS = 2000

/** Stage one screenshot and start its critique, finding both controls by their Russian names. */
function startOneScreenCritique(): void {
  const drop = screen.getByRole('button', { name: new RegExp(tr('ru', 'composer.drop_screenshots_or_click_to_browse')) })
  const file = new File(['pixels'], 'cart.png', { type: 'image/png' })
  fireEvent.drop(drop, { dataTransfer: { files: [file], types: ['Files'] } })
  fireEvent.click(screen.getByRole('button', { name: new RegExp(tr('ru', 'composer.critique_this_screen')) }))
}

type Tree = { [key: string]: string | Tree }

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'string') out[prefix + key] = value
    else Object.assign(out, flatten(value, `${prefix}${key}.`))
  }
  return out
}

beforeEach(async () => {
  vi.clearAllMocks()
  localStorage.clear()
  vi.useFakeTimers()
  mockApi.openSlot.mockResolvedValue({ key: 'slot-1' })
  mockApi.send.mockResolvedValue(undefined)
  mockApi.deleteSlot.mockResolvedValue(undefined)
  mockApi.uploadFiles.mockResolvedValue({ paths: ['/tmp/shot-1.png'] })
  mockApi.method.mockResolvedValue({ skill: '', checklist: '' })
  mockApi.getSlot.mockResolvedValue({ running: true, messages: [] })
  await i18next.changeLanguage('ru')
})

afterEach(async () => {
  cleanup()
  vi.useRealTimers()
  await i18next.changeLanguage('en')
})
afterAll(async () => { await i18next.changeLanguage('en') })

describe('Design Critique failure text', () => {
  it('says in Russian that the critic replied in no readable format', async () => {
    mockApi.getSlot.mockResolvedValue({
      running: false, messages: [{ role: 'assistant', content: 'I had a look and it seems fine.' }],
    })
    render(<DesignCritiquePage />)
    startOneScreenCritique()
    await tick(POLL_MS)

    expect(screen.getByText(tr('ru', 'designCritiquePage.the_critic_replied_but_not_in_a_readable_format')))
      .toBeInTheDocument()
  })

  it('says in Russian that a vanished run is no longer available', async () => {
    mockApi.getSlot.mockRejectedValue(new Error('404'))
    render(<DesignCritiquePage />)
    startOneScreenCritique()
    await tick(POLL_MS)
    await tick(8 * 1500)

    expect(screen.getByText(tr('ru', 'designCritiquePage.that_run_is_no_longer_available_start_a_new_critique')))
      .toBeInTheDocument()
  })

  it('says in Russian that an upload returned no files', async () => {
    mockApi.uploadFiles.mockResolvedValue({ paths: [] })
    render(<DesignCritiquePage />)
    startOneScreenCritique()
    await tick()

    expect(screen.getByText(tr('ru', 'designCritiquePage.no_file_paths_returned'))).toBeInTheDocument()
  })

  it('keeps every new line in each shipped language', () => {
    const keys = [
      'designCritiquePage.that_run_is_no_longer_available_start_a_new_critique',
      'designCritiquePage.the_critic_replied_but_not_in_a_readable_format',
      'designCritiquePage.lost_contact',
      'designCritiquePage.no_file_paths_returned',
      'common.lost_contact_with_the_scan',
      'common.that_run_did_not_finish',
    ]
    for (const lng of LANGUAGES) for (const key of keys) tr(lng, key)
  })

  it('ships no sentence verbatim in English in another language', () => {
    const en = flatten(CATALOGS.en as Tree)
    const untranslated: string[] = []
    for (const lng of LANGUAGES) {
      const catalog = flatten(CATALOGS[lng] as Tree)
      for (const [key, text] of Object.entries(en)) {
        // Three words or more is a sentence; a one- or two-word name ("Design
        // Critique", "Figma file") may legitimately read the same.
        if (text.split(/\s+/).length >= 3 && catalog[key] === text) untranslated.push(`${lng}: ${key}`)
      }
    }
    expect(untranslated).toEqual([])
  })

  it.each([
    ["DesignCritiquePage.tsx", "new Error('That run is no longer available"],
    ["DesignCritiquePage.tsx", "new Error('The critic replied"],
    ["DesignCritiquePage.tsx", "new Error('lost contact')"],
    ["DesignCritiquePage.tsx", "new Error('no file paths returned')"],
    ["api.ts", "new Error('lost contact with the scan')"],
    ["api.ts", "'that run did not finish'"],
  ])('%s takes its error text from the catalog (%s)', (file, literal) => {
    expect(sourceText(file)).not.toContain(literal)
  })
})
