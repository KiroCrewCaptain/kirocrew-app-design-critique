/// <reference types="vite/client" />
/**
 * The page's own source files as text, for the tests that pin an English
 * literal out of the source. Read through Vite's `?raw` glob, so the tests need
 * no Node `fs` (the typecheck has no Node types).
 */
const SOURCES = import.meta.glob('../src/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

/** The names of every file under `src/`. */
export const SOURCE_FILES: string[] = Object.keys(SOURCES).map(p => p.slice('../src/'.length)).sort()

/** The text of `src/<file>`; a name with no such file fails the test. */
export function sourceText(file: string): string {
  const text = SOURCES['../src/' + file]
  if (text === undefined) throw new Error(`no source file src/${file}`)
  return text
}
