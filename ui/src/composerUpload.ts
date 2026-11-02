/**
 * The composer upload body (`POST /api/upload/file`): oversized raster images are
 * downscaled in the browser first (`resizeImage.ts`, copied from the dashboard),
 * then posted as one multipart body whose `paths` answer lists one stored path
 * per file, in order.
 *
 * The dashboard's own composer also converts a HEIC/HEIF photo to JPEG before
 * it uploads. That converter is not part of the App Kit, so here a HEIC photo is
 * uploaded as it is (PORTING.md, "Remaining gaps").
 */
import { t as i18nT } from './i18n'
import { resizeImageForModel, type ResizeInfo, type ResizeResult } from './resizeImage'

export const COMPOSER_UPLOAD_PATH = '/api/upload/file'

export interface ComposerUploadResult {
  paths: string[]
  /** The server's refusal, or a client-side reading of a bad response. */
  error?: string
  resized: ResizeInfo[]
}

/** Upload `files` through `post`, which sends the multipart body and returns the
 *  response. A refusal is returned as `error` or thrown by `post`; a transport
 *  error propagates. */
export async function uploadComposerFiles(
  files: File[],
  post: (body: FormData) => Promise<Response>,
): Promise<ComposerUploadResult> {
  // One file at a time: a full-size photo decodes to tens of megabytes of
  // pixels, and twenty at once would not fit.
  const prepared: ResizeResult[] = []
  for (const f of files) prepared.push(await resizeImageForModel(f))
  const resized = prepared.map(p => p.info).filter((i): i is ResizeInfo => i !== null)
  const fd = new FormData()
  prepared.forEach(p => fd.append('file', p.file))
  const res = await post(fd)
  let body: { paths?: unknown; error?: string }
  try { body = await res.json() } catch { body = {} }
  if (!res.ok) return { paths: [], error: body.error || res.statusText, resized }
  if (!Array.isArray(body.paths)) return { paths: [], error: i18nT('common.unexpected_server_response'), resized }
  return { paths: body.paths as string[], resized }
}
