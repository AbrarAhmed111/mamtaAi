import type { UsageStats } from './types'

export function getCurrentUsagePeriod(timezone?: string | null): string {
  const now = timezone
    ? new Date(new Date().toLocaleString('en-US', { timeZone: timezone }))
    : new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function normalizeUsageStats(raw: UsageStats | null | undefined, period: string): UsageStats {
  const base: UsageStats = {
    period,
    recordings_count: 0,
    activities_count: 0,
    forum_threads_count: 0,
    forum_threads_week_count: 0,
    blog_posts_count: 0,
    exports_count: 0,
  }
  if (!raw || typeof raw !== 'object') return base
  if (raw.period !== period) return base
  return {
    ...base,
    ...raw,
    period,
  }
}
