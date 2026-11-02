import { describe, it, expect } from 'vitest'
import { micromark } from 'micromark'
import { IMAGES_PROMPT } from '../src/prompts'

/**
 * Design Critique's prompt is an ordinary chat message — `designCritiqueApi.send`
 * POSTs it to `/api/chat` — so the screens it references reach the transcript in
 * the same `![alt](dest)` wire format every other attachment uses, and are drawn
 * by the dashboard's CommonMark renderer, which rewrites each local image
 * destination to `/api/file-raw?path=<the path>`.
 *
 * The dashboard's renderer is not part of the App Kit, so these cases parse the
 * prompt with `micromark` (a CommonMark reference parser) and apply the same
 * rewrite. They pin `IMAGES_PROMPT`, which was the one producer of that format
 * not going through `mdImageDest`:
 *
 *  - a drive path's separators are backslashes, and CommonMark drops a backslash
 *    before ASCII punctuation, so `\.kiro\` parsed as `.kiro` and the `<img>`
 *    named a path one directory short of the file;
 *  - a bare destination ends at the first space, so a home directory with a
 *    space in it (`C:\Users\John Doe\…`) produced no `<img>` at all — the line
 *    stayed in the bubble as literal markdown text.
 *
 * The upload endpoint returns a server-native absolute path
 * (`api_upload_file` -> `str(dest)` under `data_home()/uploads`), so this is the
 * shape the app actually hands `IMAGES_PROMPT`.
 */

/** The `src` of every image CommonMark reads in `markdown`, as the dashboard
 *  serves a local one: the decoded destination behind `/api/file-raw`. */
function imgs(markdown: string): string[] {
  const host = document.createElement('div')
  // A drive letter reads as a URL scheme, which micromark blanks by default; the
  // dashboard treats it as a local path, so keep it.
  host.innerHTML = micromark(markdown, { allowDangerousProtocol: true })
  return [...host.querySelectorAll('img')].map((i) => {
    const dest = decodeURI(i.getAttribute('src') || '')
    return `/api/file-raw?path=${encodeURIComponent(dest)}`
  })
}

function fileRaw(path: string): string {
  return `/api/file-raw?path=${encodeURIComponent(path)}`
}

describe('design critique prompt screens render as images', () => {
  it('a Windows drive path reaches file-raw as the file it names', () => {
    const prompt = IMAGES_PROMPT(['C:\\Users\\me\\.kiro\\crew\\uploads\\shot.png'])
    expect(imgs(prompt)).toEqual([fileRaw('C:/Users/me/.kiro/crew/uploads/shot.png')])
  })

  it('a home directory with a space still renders a screen', () => {
    const prompt = IMAGES_PROMPT(['C:\\Users\\John Doe\\.kiro\\crew\\uploads\\shot.png'])
    expect(imgs(prompt)).toEqual([fileRaw('C:/Users/John Doe/.kiro/crew/uploads/shot.png')])
  })

  it('a POSIX path is unchanged', () => {
    const prompt = IMAGES_PROMPT(['/home/me/.kiro/crew/uploads/shot.png'])
    expect(imgs(prompt)).toEqual([fileRaw('/home/me/.kiro/crew/uploads/shot.png')])
  })

  it('a flow renders every screen, in the order it was given', () => {
    const paths = [
      'C:\\Users\\me\\.kiro\\crew\\uploads\\1-cart.png',
      'C:\\Users\\me\\.kiro\\crew\\uploads\\2-pay.png',
    ]
    expect(imgs(IMAGES_PROMPT(paths))).toEqual([
      fileRaw('C:/Users/me/.kiro/crew/uploads/1-cart.png'),
      fileRaw('C:/Users/me/.kiro/crew/uploads/2-pay.png'),
    ])
  })

  it('the "screens" instruction still carries the paths the backend gave us', () => {
    // The markdown destination is ENCODED for markdown; the JSON list the model
    // is told to echo back is not, and must stay byte-identical to what the
    // upload endpoint returned. `resolveScreens` pairs the report to the
    // uploads by index, so nothing here is a matching key -- but the model is
    // asked for "the absolute image path", and that is this list.
    const paths = ['C:\\Users\\me\\.kiro\\crew\\uploads\\shot.png']
    expect(IMAGES_PROMPT(paths)).toContain(JSON.stringify(paths))
  })
})
