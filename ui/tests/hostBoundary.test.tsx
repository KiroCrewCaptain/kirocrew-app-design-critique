/**
 * What changed when the page left the dashboard's source tree.
 *
 * - Every request goes through the host's scoped client (`useAppApi().raw`),
 *   bound once at the page root; a path outside `permissions.api` is refused in
 *   the browser, and a refusal reaches the page as an `ApiError` carrying the
 *   server's own sentence.
 * - Uploads post one multipart body to `/api/upload/file` through that client.
 * - The spinner and the scan sweep are Web Animations, not Framer Motion, and a
 *   reduced-motion preference swaps them for still forms.
 */
import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, bindAppApi, currentAppApi, friendlyErrText } from '../src/appApi'
import { designCritiqueApi } from '../src/api'
import { Spinner, Sweep } from '../src/Motion'
import DesignCritiqueApp from '../src/index'
import { useAppApi } from './stubs/app-sdk'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the scoped client', () => {
  it('refuses a call before the page root bound it', () => {
    bindAppApi(null as unknown as ReturnType<typeof useAppApi>)
    expect(() => currentAppApi()).toThrow(/not bound/)
  })

  it('is bound by the page root', () => {
    bindAppApi(null as unknown as ReturnType<typeof useAppApi>)
    fetchMock.mockImplementation(async () => json({}))
    // The root binds whatever the host's `useAppApi()` returns.
    render(<DesignCritiqueApp />)
    expect(currentAppApi()).toBe(useAppApi())
  })

  it('turns a refusal into an ApiError with the server sentence', async () => {
    fetchMock.mockResolvedValueOnce(json({ error: 'owner authorization required', code: 'owner_only' }, 403))
    const err = await designCritiqueApi.getSlot('s').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(403)
    expect((err as ApiError).message).toBe('owner authorization required')
    expect(JSON.parse((err as ApiError).body).code).toBe('owner_only')
  })

  it('keeps every request inside the manifest permissions', async () => {
    fetchMock.mockImplementation(async () => json({}))
    await designCritiqueApi.method()
    await designCritiqueApi.getSlot('k')
    for (const [path] of fetchMock.mock.calls) {
      expect(String(path)).toMatch(/^\/api\/(apps\/design-critique|chat)/)
    }
    await expect(currentAppApi().raw('/api/config')).rejects.toThrow(/not permitted/)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('reads a plain-text or HTML refusal as plainly as it can', () => {
    expect(friendlyErrText(502, 'gateway down')).toBe('gateway down')
    expect(friendlyErrText(502, '<html>proxy</html>')).toBe('HTTP 502')
    expect(friendlyErrText(500, '')).toBe('HTTP 500')
  })
})

describe('uploads', () => {
  it('posts one multipart body and returns the stored paths in order', async () => {
    fetchMock.mockResolvedValueOnce(json({ paths: ['/u/a.png', '/u/b.png'] }))
    const files = [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')]
    await expect(designCritiqueApi.uploadFiles(files)).resolves.toEqual({ paths: ['/u/a.png', '/u/b.png'] })
    const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(path).toBe('/api/upload/file')
    expect(init.method).toBe('POST')
    expect((init.body as FormData).getAll('file')).toHaveLength(2)
  })

  it('throws the server refusal', async () => {
    fetchMock.mockResolvedValueOnce(json({ error: 'file too large' }, 413))
    await expect(designCritiqueApi.uploadFiles([new File(['a'], 'a.txt')])).rejects.toThrow('file too large')
  })
})

describe('animations', () => {
  it('drives the spinner and the sweep through Element.animate', () => {
    const cancel = vi.fn()
    const animate = vi.fn(() => ({ cancel }))
    Object.defineProperty(HTMLElement.prototype, 'animate', { value: animate, configurable: true })
    try {
      const { unmount } = render(<><Spinner reduceMotion={false} /><Sweep index={2} reduceMotion={false} /></>)
      expect(animate).toHaveBeenCalledTimes(2)
      const [, sweepOptions] = animate.mock.calls[1] as unknown as [Keyframe[], KeyframeAnimationOptions]
      expect(sweepOptions).toMatchObject({ duration: 2200, iterations: Infinity, delay: 700 })
      unmount()
      expect(cancel).toHaveBeenCalledTimes(2)
    } finally {
      delete (HTMLElement.prototype as { animate?: unknown }).animate
    }
  })

  it('animates nothing under reduced motion', () => {
    const animate = vi.fn(() => ({ cancel: vi.fn() }))
    Object.defineProperty(HTMLElement.prototype, 'animate', { value: animate, configurable: true })
    try {
      const { container } = render(<><Spinner reduceMotion /><Sweep index={0} reduceMotion /></>)
      expect(animate).not.toHaveBeenCalled()
      expect(container.querySelectorAll('span').length).toBeGreaterThan(0)
    } finally {
      delete (HTMLElement.prototype as { animate?: unknown }).animate
    }
  })
})
