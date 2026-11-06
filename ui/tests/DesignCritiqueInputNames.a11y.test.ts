/**
 * Every text input in the page carries an accessible name, not just a
 * placeholder. A placeholder vanishes once the field has text and assistive
 * tech does not reliably announce it.
 *
 * The scan is the dashboard's `test/inputAccessibleNames.ts`, restated here:
 * every `<input …>` opening tag in a source file (comments stripped), less the
 * non-text types, must carry `aria-label`, `aria-labelledby` or an `id` for a
 * `<label htmlFor>`.
 */
import { describe, expect, it } from 'vitest'
import { SOURCE_FILES, sourceText } from './sourceText'

function inputTags(file: string): string[] {
  const s = sourceText(file)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
  const tags: string[] = []
  let i = 0
  while ((i = s.indexOf('<input', i)) >= 0) {
    let j = i + 6
    let depth = 0
    for (; j < s.length; j++) {
      const c = s[j]
      if (c === '{') depth++
      else if (c === '}') depth--
      else if (c === '>' && depth === 0) break
    }
    tags.push(s.slice(i, j + 1))
    i = j
  }
  return tags
}

function unnamedTextInputs(file: string): string[] {
  return inputTags(file).filter(tag =>
    !/type=["'](hidden|checkbox|radio|file|submit|range|color)["']/.test(tag)
    // A spread of the caller's props may carry the name; a handler spread
    // such as `{...ime.bindEnter(...)}` cannot.
    && !/aria-label|aria-labelledby|\bid=|\{\.\.\.(props|rest|inputProps)\b/.test(tag))
}

describe('Design Critique text inputs have an accessible name', () => {
  const files = SOURCE_FILES.filter(f => f.endsWith('.tsx'))

  it('scans the page sources', () => {
    expect(files).toEqual(expect.arrayContaining(['AskLayer.tsx', 'Composer.tsx']))
  })

  for (const file of files) {
    it(`${file} names every text input`, () => {
      expect(unnamedTextInputs(file)).toEqual([])
    })
  }
})
