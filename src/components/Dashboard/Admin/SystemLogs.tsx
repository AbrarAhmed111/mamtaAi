'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from '@/components/ui/sonner'
import Spinner from '@/components/ui/spinner'
import { AdminBadge, AdminEmptyState, AdminPageHeader, AdminTableShell } from './AdminUi'

type AuditRow = {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  status: string | null
  created_at: string
  actor?: { full_name?: string } | null
}

type ErrorRow = {
  id: string
  error_type: string
  error_message: string
  severity: string | null
  endpoint: string | null
  is_resolved: boolean
  created_at: string
}

export default function SystemLogs() {
  const [tab, setTab] = useState<'audit' | 'errors'>('audit')
  const [audit, setAudit] = useState<AuditRow[]>([])
  const [errors, setErrors] = useState<ErrorRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const type = tab === 'audit' ? 'audit' : 'errors'
      const res = await fetch(`/api/admin/logs?type=${type}`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to load logs')
      if (tab === 'audit') setAudit(data.audit || [])
      else setErrors(data.errors || [])
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    void load()
  }, [load])

  const resolveError = async (id: string) => {
    try {
      const res = await fetch('/api/admin/logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorId: id }),
      })
      if (!res.ok) throw new Error('Failed to resolve')
      toast.success('Error marked resolved')
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to resolve')
    }
  }

  return (
    <div>
      <AdminPageHeader title="System logs" description="Audit trail and application errors." />

      <div className="mb-4 flex gap-2">
        {(['audit', 'errors'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200/40'
                : 'border border-pink-100 text-gray-600 hover:bg-pink-50'
            }`}
          >
            {t === 'audit' ? 'Audit logs' : 'Error logs'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : tab === 'audit' ? (
        <AdminTableShell>
          {audit.length === 0 ? (
            <AdminEmptyState message="No audit entries yet. Admin actions will appear here." />
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-pink-100 bg-pink-50/50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {audit.map(row => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{row.actor?.full_name || 'System'}</td>
                    <td className="px-4 py-3 font-medium">{row.action}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.entity_type}
                      {row.entity_id && (
                        <span className="block text-xs text-gray-400 truncate max-w-[12rem]">
                          {row.entity_id}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminTableShell>
      ) : (
        <AdminTableShell>
          {errors.length === 0 ? (
            <AdminEmptyState message="No error logs recorded yet." />
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-pink-100 bg-pink-50/50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {errors.map(row => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{row.error_type}</td>
                    <td className="px-4 py-3 max-w-md truncate">{row.error_message}</td>
                    <td className="px-4 py-3">
                      <AdminBadge
                        tone={
                          row.severity === 'critical' || row.severity === 'high'
                            ? 'rose'
                            : 'amber'
                        }
                      >
                        {row.severity || 'medium'}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-3">
                      {!row.is_resolved && (
                        <button
                          type="button"
                          onClick={() => void resolveError(row.id)}
                          className="text-pink-600 hover:underline text-xs"
                        >
                          Resolve
                        </button>
                      )}
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
