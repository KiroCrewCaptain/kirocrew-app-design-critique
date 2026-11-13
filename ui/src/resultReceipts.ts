/** Persist only a newly completed critique, without affecting browser history on failure. */
import { currentAppApi } from './appApi'
import type { Report, Screen } from './types'

export async function publishCompletedResult(slotKey: string, screens: Screen[], report: Report): Promise<string | null> {
  try {
    const response = await currentAppApi().raw('/api/apps/design-critique/results', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotKey,
        read: report.overallRead || '',
        report,
        screens: screens.map(({ step, label }) => ({ step, label })),
      }),
    })
    const saved: unknown = await response.json()
    const id = saved && typeof saved === 'object' ? (saved as { resource_id?: unknown }).resource_id : null
    return typeof id === 'string' && /^[a-f0-9]{64}$/.test(id) ? id : null
  } catch {
    // The host may predate durable receipts, or this UI may hold only an App
    // token. Its existing browser-local completed report remains available.
    return null
  }
}
