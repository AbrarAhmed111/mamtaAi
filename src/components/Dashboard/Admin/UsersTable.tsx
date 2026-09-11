'use client'



import { useCallback, useEffect, useState } from 'react'

import Link from 'next/link'

import Image from 'next/image'

import { FaUser } from 'react-icons/fa'

import { toast } from '@/components/ui/sonner'

import Spinner from '@/components/ui/spinner'

import Select from '@/components/ui/select'

import { ADMIN_ROLE_FILTER_OPTIONS } from '@/lib/admin/user-options'

import { AdminBadge, AdminEmptyState, AdminPageHeader, AdminTableShell, ADMIN_BTN_PRIMARY } from './AdminUi'



type UserRow = {
  id: string
  fullName: string
  role: string
  isExpert: boolean
  accountType: string
  isVerified: boolean
  avatarUrl?: string | null
  createdAt: string
  suspended: boolean
  suspensionReason: string | null
}



export default function UsersTable() {

  const [users, setUsers] = useState<UserRow[]>([])

  const [loading, setLoading] = useState(true)

  const [q, setQ] = useState('')

  const [roleFilter, setRoleFilter] = useState('')



  const load = useCallback(async () => {

    setLoading(true)

    try {

      const params = new URLSearchParams()

      if (q) params.set('q', q)

      if (roleFilter) params.set('role', roleFilter)

      const res = await fetch(`/api/admin/users?${params}`, { cache: 'no-store' })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(data.error || 'Failed to load users')

      setUsers(data.users || [])

    } catch (e: unknown) {

      toast.error(e instanceof Error ? e.message : 'Failed to load users')

    } finally {

      setLoading(false)

    }

  }, [q, roleFilter])



  useEffect(() => {

    void load()

  }, [load])



  return (

    <div>

      <AdminPageHeader title="Users" description="Search, review, and manage platform accounts." />



      <div className="mb-4 flex flex-col gap-3 sm:flex-row">

        <input

          value={q}

          onChange={e => setQ(e.target.value)}

          placeholder="Search by name or ID…"

          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm"

        />

        <Select

          value={roleFilter}

          onChange={setRoleFilter}

          options={[...ADMIN_ROLE_FILTER_OPTIONS]}

          aria-label="Filter by role"

        />

        <button

          type="button"

          onClick={() => void load()}

          className={ADMIN_BTN_PRIMARY}

        >

          Search

        </button>

      </div>



      {loading ? (

        <div className="flex justify-center py-16">

          <Spinner size={28} />

        </div>

      ) : (

        <AdminTableShell>

          {users.length === 0 ? (

            <AdminEmptyState message="No users found." />

          ) : (

            <table className="min-w-full text-left text-sm">

              <thead className="border-b border-pink-100 bg-pink-50/50 text-xs uppercase text-gray-500">

                <tr>

                  <th className="px-4 py-3">User</th>

                  <th className="px-4 py-3">Role</th>

                  <th className="px-4 py-3">Status</th>

                  <th className="px-4 py-3">Joined</th>

                  <th className="px-4 py-3">Actions</th>

                </tr>

              </thead>

              <tbody className="divide-y divide-pink-50">

                {users.map(u => (

                  <tr key={u.id} className="hover:bg-pink-50/30">

                    <td className="px-4 py-3">

                      <Link

                        href={`/dashboard/admin/users/${u.id}`}

                        className="flex items-center gap-3 font-medium text-gray-900 hover:text-pink-600"

                      >

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-pink-200 bg-pink-50">

                          {u.avatarUrl ? (

                            <Image src={u.avatarUrl} alt={u.fullName} width={40} height={40} className="h-10 w-10 object-cover" />

                          ) : (

                            <FaUser className="text-pink-400" />

                          )}

                        </div>

                        <span className="truncate">{u.fullName}</span>

                      </Link>

                    </td>

                    <td className="px-4 py-3">{u.accountType || u.role}</td>

                    <td className="px-4 py-3">

                      {u.suspended ? (

                        <AdminBadge tone="rose">Suspended</AdminBadge>

                      ) : (

                        <AdminBadge tone="green">Active</AdminBadge>

                      )}

                    </td>

                    <td className="px-4 py-3 text-gray-500">

                      {new Date(u.createdAt).toLocaleDateString()}

                    </td>

                    <td className="px-4 py-3">

                      <Link

                        href={`/dashboard/admin/users/${u.id}`}

                        className="text-pink-600 hover:underline"

                      >

                        Manage

                      </Link>

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

