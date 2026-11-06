/**
 * Design Critique's API client surfaces a refusal as its typed error: the
 * dashboard's own rows for this app (`apps/design-critique/api.typedErrors.test.ts`).
 * A refusal body reaches the UI as the human message, not raw wire JSON, and a
 * caller can branch on the status.
 *
 * The dashboard's 429 row (an API Gateway burst throttle relabelled as "Rate
 * limited by the tunnel edge") is not here: that relabel lives in the
 * dashboard's shared `api/apiError.ts`, which a bundle cannot import, and this
 * app's `friendlyErrText` reads such a body by its `message` field instead.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../src/appApi'
import { designCritiqueApi } from '../src/api'

/** A refusal whose body is the JSON envelope the backends actually send. */
const REFUSAL = JSON.stringify({ error: 'path is outside the sandbox' })

const refuse = (status = 403, body = REFUSAL) =>
  vi.fn().mockImplementation(async () => new Response(body, { status }))

describe('designCritiqueApi surfaces refusals as ApiError', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is typed, status-bearing, and carries the unwrapped message', async () => {
    vi.stubGlobal('fetch', refuse())
    const call = () => designCritiqueApi.getSlot('slot-1')
    await expect(call()).rejects.toThrow(ApiError)
    const e = (await call().catch((err: unknown) => err)) as ApiError
    expect(e.status).toBe(403)
    // The human message, not the envelope — this is what the page renders.
    expect(e.message).toBe('path is outside the sandbox')
    expect(e.message).not.toContain('{"error"')
    // The envelope stays reachable for a caller that wants structured fields.
    expect(e.body).toBe(REFUSAL)
  })

  it('keeps the HTTP <status> fallback for an empty body', async () => {
    vi.stubGlobal('fetch', refuse(500, ''))
    const e = (await designCritiqueApi.getSlot('slot-1').catch((err: unknown) => err)) as ApiError
    expect(e).toBeInstanceOf(ApiError)
    expect(e.message).toBe('HTTP 500')
  })
})
