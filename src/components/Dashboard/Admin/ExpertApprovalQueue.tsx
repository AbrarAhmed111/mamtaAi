'use client'



import { useCallback, useEffect, useState } from 'react'

import { toast } from '@/components/ui/sonner'

import Spinner from '@/components/ui/spinner'

import { AdminEmptyState, AdminPageHeader, AdminTableShell } from './AdminUi'



type ExpertRow = {

  id: string

  applicationId: string | null

  fullName: string

  createdAt: string

  specialization: string | null

  professionalTitle: string | null

  yearsOfExperience: number | string | null

  licenseNumber: string | null

  bio: string | null

  documentUrl: string | null

  documentName: string | null

  source: 'application' | 'legacy'

}



export default function ExpertApprovalQueue() {

  const [experts, setExperts] = useState<ExpertRow[]>([])

  const [loading, setLoading] = useState(true)

  const [busyId, setBusyId] = useState<string | null>(null)

  const [rejectId, setRejectId] = useState<string | null>(null)

  const [rejectReason, setRejectReason] = useState('')



  const load = useCallback(async () => {

    setLoading(true)

    try {

      const res = await fetch('/api/admin/experts', { cache: 'no-store' })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(data.error || 'Failed to load experts')

      setExperts(data.experts || [])

    } catch (e: unknown) {

      toast.error(e instanceof Error ? e.message : 'Failed to load queue')

    } finally {

      setLoading(false)

    }

  }, [])



  useEffect(() => {

    void load()

  }, [load])



  const review = async (row: ExpertRow, action: 'approve' | 'reject', reason?: string) => {

    setBusyId(row.id)

    try {

      const res = await fetch(`/api/admin/experts/${row.id}`, {

        method: 'PATCH',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          action,

          applicationId: row.applicationId,

          rejectionReason: reason,

        }),

      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(data.error || 'Action failed')

      toast.success(action === 'approve' ? 'Expert approved' : 'Application rejected')

      setRejectId(null)

      setRejectReason('')

      await load()

    } catch (e: unknown) {

      toast.error(e instanceof Error ? e.message : 'Action failed')

    } finally {

      setBusyId(null)

    }

  }



  return (

    <div>

      <AdminPageHeader

        title="Expert verification"

        description="Review pending expert applications and uploaded credentials."

      />



      {loading ? (

        <div className="flex justify-center py-16">

          <Spinner size={28} />

        </div>

      ) : (

        <AdminTableShell>

          {experts.length === 0 ? (

            <AdminEmptyState message="No pending expert applications." />

          ) : (

            <table className="min-w-full text-left text-sm">

              <thead className="border-b border-pink-100 bg-pink-50/50 text-xs uppercase text-gray-500">

                <tr>

                  <th className="px-4 py-3">Expert</th>

                  <th className="px-4 py-3">Credentials</th>

                  <th className="px-4 py-3">Document</th>

                  <th className="px-4 py-3">Applied</th>

                  <th className="px-4 py-3">Actions</th>

                </tr>

              </thead>

              <tbody className="divide-y divide-pink-50">

                {experts.map(e => (

                  <tr key={`${e.id}-${e.applicationId || 'legacy'}`}>

                    <td className="px-4 py-3">

                      <p className="font-medium text-gray-900">{e.fullName}</p>

                      {e.bio && <p className="mt-1 max-w-md text-xs text-gray-500 line-clamp-2">{e.bio}</p>}

                    </td>

                    <td className="px-4 py-3 text-gray-600">

                      <p>{e.professionalTitle || '—'}</p>

                      {e.specialization && (

                        <span className="block text-xs text-gray-400">{e.specialization}</span>

                      )}

                      {e.licenseNumber && (

                        <span className="block text-xs text-gray-400">License: {e.licenseNumber}</span>

                      )}

                      {e.yearsOfExperience != null && (

                        <span className="block text-xs text-gray-400">{e.yearsOfExperience} yrs</span>

                      )}

                    </td>

                    <td className="px-4 py-3">

                      {e.documentUrl ? (

                        <a

                          href={e.documentUrl}

                          target="_blank"

                          rel="noopener noreferrer"

                          className="text-xs font-medium text-pink-600 hover:text-pink-700"

                        >

                          {e.documentName || 'View document'}

                        </a>

                      ) : (

                        <span className="text-xs text-gray-400">—</span>

                      )}

                    </td>

                    <td className="px-4 py-3 text-gray-500">

                      {new Date(e.createdAt).toLocaleDateString()}

                    </td>

                    <td className="px-4 py-3">

                      <div className="flex flex-wrap gap-2">

                        <button

                          type="button"

                          disabled={busyId === e.id}

                          onClick={() => void review(e, 'approve')}

                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"

                        >

                          Approve

                        </button>

                        <button

                          type="button"

                          disabled={busyId === e.id}

                          onClick={() => setRejectId(e.id)}

                          className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-60"

                        >

                          Reject

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



      {rejectId ? (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

            <h3 className="text-lg font-bold text-gray-900">Reject application</h3>

            <p className="mt-2 text-sm text-gray-600">Optional reason shown to the applicant. Re-apply cooldown is 7 days.</p>

            <textarea

              value={rejectReason}

              onChange={ev => setRejectReason(ev.target.value)}

              rows={3}

              className="mt-4 w-full rounded-xl border border-pink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"

              placeholder="Reason for rejection (optional)"

            />

            <div className="mt-4 flex justify-end gap-2">

              <button

                type="button"

                onClick={() => {

                  setRejectId(null)

                  setRejectReason('')

                }}

                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600"

              >

                Cancel

              </button>

              <button

                type="button"

                disabled={busyId === rejectId}

                onClick={() => {

                  const row = experts.find(x => x.id === rejectId)

                  if (row) void review(row, 'reject', rejectReason.trim() || undefined)

                }}

                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"

              >

                Reject

              </button>

            </div>

          </div>

        </div>

      ) : null}

    </div>

  )

}

