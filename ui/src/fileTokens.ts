/**
 * `mdImageDest`, copied from the dashboard's `utils/fileTokens.ts`: a stored
 * upload path as a CommonMark image destination. A path in the plain-safe subset
 * is used as is; anything else is wrapped in `<…>` with `%`, `\`, `<` and `>`
 * escaped, so a space or a parenthesis in a file name cannot end the link early.
 * A Windows-shaped path (drive letter or UNC) is first spelled with forward
 * slashes, as the dashboard does for paths its upload endpoint returns.
 */

const WINDOWS_SHAPED_PATH_RE = /^(?:[A-Za-z]:|\\\\[^\\/]+)[\\/]/

export function normalizeWindowsPath(p: string): string {
  return WINDOWS_SHAPED_PATH_RE.test(p) ? p.replace(/\\/g, '/') : p
}

export function mdImageDest(p: string): string {
  const normalized = normalizeWindowsPath(p)
  if (/^[\w/.@:~-]*$/.test(normalized) && !normalized.includes('%')) return normalized
  const escaped = normalized.replace(/%/g, '%25').replace(/[\\<>]/g, c => '\\' + c)
  return `<${escaped}>`
}
