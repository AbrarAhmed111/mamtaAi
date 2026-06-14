'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from '@/components/ui/sonner'
import Spinner from '@/components/ui/spinner'
import { AdminBadge, AdminEmptyState, AdminPageHeader, AdminTableShell } from './AdminUi'

type ReportRow = {
  id: string
  contentType: string
  contentId: string
  reason: string | null
  status: string
  createdAt: string
  reporterName: string
  contentPreview: string
}

export default function ModerationQueue() {
  const [items, setItems] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/community?status=pending', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok && data.error) throw new Error(data.error)
      setItems(data.items || [])
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const removeContent = async (row: ReportRow) => {
    setBusyId(row.id)
    try {
      const type =
        row.contentType === 'blog_post'
          ? 'blog_post'
          : row.contentType === 'blog_comment'
            ? 'blog_comment'
            : row.contentType === 'forum_reply'
              ? 'forum_reply'
              : 'forum_thread'
      const res = await fetch(`/api/admin/community/${type}/${row.contentId}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Remove failed')
      toast.success('Content removed')
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Remove failed')
    } finally {
      setBusyId(null)
    }
  }

  const dismiss = async (row: ReportRow) => {
    setBusyId(row.id)
    try {
      const type = row.contentType.replace('_', '_')
      const res = await fetch(`/api/admin/community/${type}/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Dismiss failed')
      }
      toast.success('Report dismissed')
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Dismiss failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Community moderation"
        description="Review reported blog posts, forum threads, and replies."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : (
        <AdminTableShell>
          {items.length === 0 ? (
            <AdminEmptyState message="No pending reports. Run supabase/admin_setup.sql if the reports table is missing." />
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-pink-100 bg-pink-50/50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Content</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Reporter</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {items.map(row => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-gray-900 line-clamp-2">{row.contentPreview}</p>
                      <p className="mt-1 text-xs text-gray-400">{row.contentId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <AdminBadge tone="purple">{row.contentType.replace('_', ' ')}</AdminBadge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.reporterName}</td>
                    <td className="px-4 py-3 text-gray-500">{row.reason || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void removeContent(row)}
                          className="rounded-lg bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void dismiss(row)}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                        >
                          Dismiss
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminTableShell>
      )}
    </div>
  )
}
