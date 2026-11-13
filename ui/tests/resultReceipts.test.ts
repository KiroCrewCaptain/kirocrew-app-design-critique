import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindAppApi } from '../src/appApi'
import { publishCompletedResult } from '../src/resultReceipts'
import { useAppApi } from './stubs/app-sdk'

describe('completed report receipts', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('publishes the completed report through the scoped Owner UI transport', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ resource_id: 'a'.repeat(64), status: 'complete' }), { status: 201 }))
    vi.stubGlobal('fetch', fetcher)
    bindAppApi(useAppApi())
    const report = { overallRead: 'Clear flow', findings: [] }
    const resource = await publishCompletedResult('dc-one', [{ step: 1, label: 'Start', url: '/api/file-raw?path=private' }], report)
    expect(resource).toBe('a'.repeat(64))
    const [path, options] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    expect(path).toBe('/api/apps/design-critique/results')
    const body = JSON.parse(String(options.body))
    expect(body.report).toEqual(report)
    expect(body.screens).toEqual([{ step: 1, label: 'Start' }])
    expect(JSON.stringify(body)).not.toContain('private')
  })

  it('keeps the existing completed report usable on an older gateway', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })))
    bindAppApi(useAppApi())
    expect(await publishCompletedResult('dc-one', [], { overallRead: 'Saved in browser' })).toBeNull()
  })
})
