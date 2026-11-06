/**
 * The composer upload downscales an oversized image before the POST and posts a
 * small one unchanged: the dashboard's own rows for this app
 * (`apps/design-critique/uploads.test.ts`), less the HEIC rows, because this
 * bundle has no HEIC converter (PORTING.md, "Remaining gaps").
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const resizeImageForModel = vi.fn()
vi.mock('../src/resizeImage', async importOriginal => ({
  ...(await importOriginal<typeof import('../src/resizeImage')>()),
  resizeImageForModel: (...args: unknown[]) => resizeImageForModel(...args),
}))

const { designCritiqueApi } = await import('../src/api')

const big = () => new File([new Uint8Array(8)], 'big.png', { type: 'image/png' })
const small = () => new File([new Uint8Array(3)], 'small.png', { type: 'image/png' })
const shrunk = () => new File([new Uint8Array(1)], 'big.jpg', { type: 'image/jpeg' })
const resizeInfo = { name: 'big.png', fromW: 6000, fromH: 4000, toW: 1568, toH: 1045, fromBytes: 8, toBytes: 1 }

type Upload = { name: string; type: string }
let sent: Upload[][]

function stubUpload(paths: string[]) {
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    sent.push(((init.body as FormData).getAll('file') as File[]).map(f => ({ name: f.name, type: f.type })))
    return new Response(JSON.stringify({ paths }), { status: 200 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** The upload, read as the paths it got or the error it throws. */
type Outcome = { paths: string[]; error?: string }
const upload = (files: File[]): Promise<Outcome> => designCritiqueApi.uploadFiles(files).then(
  r => ({ paths: r.paths }), (e: Error) => ({ paths: [], error: e.message }))

describe('design critique composer upload', () => {
  beforeEach(() => {
    sent = []
    resizeImageForModel.mockReset()
    resizeImageForModel.mockImplementation(async (f: File) => (f.name === 'big.png' ? { file: shrunk(), info: resizeInfo } : { file: f, info: null }))
  })
  afterEach(() => { vi.unstubAllGlobals() })

  it('posts the downscaled copy of an oversized image', async () => {
    const fetchMock = stubUpload(['/u/a_big.jpg'])
    expect(await upload([big()])).toEqual({ paths: ['/u/a_big.jpg'] })
    expect(fetchMock).toHaveBeenCalledWith('/api/upload/file', expect.objectContaining({ method: 'POST' }))
    expect(sent).toEqual([[{ name: 'big.jpg', type: 'image/jpeg' }]])
  })

  it('posts a small PNG unchanged', async () => {
    stubUpload(['/u/a_small.png'])
    expect(await upload([small()])).toEqual({ paths: ['/u/a_small.png'] })
    expect(sent).toEqual([[{ name: 'small.png', type: 'image/png' }]])
  })

  it('throws the server\'s error text', async () => {
    resizeImageForModel.mockImplementation(async (f: File) => ({ file: f, info: null }))
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'File type not allowed' }), { status: 415 })))
    await expect(designCritiqueApi.uploadFiles([small()])).rejects.toThrow('File type not allowed')
  })
})
