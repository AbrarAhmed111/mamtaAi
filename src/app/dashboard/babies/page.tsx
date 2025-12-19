'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip } from '@/components/ui/tooltip'
import { toast } from '@/components/ui/sonner'
import { FaTrash, FaPlus, FaBaby, FaArrowRight, FaEye } from 'react-icons/fa'

interface Baby {
  id: string
  name: string
  age: string
  avatar: string
  lastCry: Date
  totalCries: number
}

export default function BabiesPage() {
  const router = useRouter()
  const [babies, setBabies] = useState<(Baby & { relations: { name: string; relationship: string }[]; gender?: string | null; bloodType?: string | null; weightKg?: number | null; heightCm?: number | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/babies', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        const list = (json.babies || []) as Array<any>
        const mapped = list.map(b => ({
          id: b.id as string,
          name: b.name as string,
          age: formatAge(b.birth_date as string),
          avatar: (b.avatar_url as string) || '/api/placeholder/64/64',
          lastCry: new Date(),
          totalCries: 0,
          relations: (b.relations as Array<any>) || [],
          gender: (b.gender as string) || null,
          bloodType: (b.blood_type as string) || null,
          weightKg: (b.birth_weight_kg as number) ?? null,
          heightCm: (b.birth_height_cm as number) ?? null,
        }))
        setBabies(mapped)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDelete = async (babyId: string, babyName: string) => {
    if (confirmDeleteId !== babyId) {
      setConfirmDeleteId(babyId)
      return
    }

    try {
      setDeletingId(babyId)
      const res = await fetch(`/api/babies/${babyId}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(data?.error || 'Failed to delete baby')
        return
      }

      toast.success(`${babyName} has been removed`)
      setBabies(prev => prev.filter(b => b.id !== babyId))
      setConfirmDeleteId(null)
    } catch (error) {
      toast.error('Failed to delete baby')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Page hero */}
      <section className="bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 rounded-2xl border border-pink-100 p-6 sm:p-8 shadow-sm">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              My Babies
            </h1>
            <p className="text-gray-600 text-sm mt-2">Manage your babies, view relations, and jump into details.</p>
          </div>
          <div className="w-full sm:w-auto">
            <Link
              href="/dashboard/babies/add-baby"
              className="mt-2 sm:mt-0 inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <FaPlus className="text-sm" />
              Add Baby
            </Link>
          </div>
        </div>
      </section>

        {loading ? (
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 text-gray-600">
            <div className="flex items-center gap-3">
              <Spinner size={20} />
              <span>Loading babies...</span>
            </div>
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : babies.length > 0 ? (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
            {/* Mobile: cards */}
            <div className="md:hidden space-y-4">
              {babies.map(b => {
                const tooltip = b.relations.map(r => `${r.name} ${r.relationship?.charAt(0).toUpperCase()}${r.relationship?.slice(1)}`).join('\n')
                const isConfirming = confirmDeleteId === b.id
                return (
                  <div
                    key={b.id}
                    className="relative border border-pink-100 rounded-xl p-4 hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-pink-50/30"
                  >
                    <Link
                      href={`/dashboard/babies/${b.id}`}
                      className="block group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={b.avatar}
                            alt={b.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-pink-200 shadow-sm"
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-pink-400 rounded-full border-2 border-white flex items-center justify-center">
                            <FaBaby className="text-white text-xs" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900 truncate text-lg">{b.name}</p>
                            <span className="text-xs text-pink-600 font-medium ml-2 shrink-0 bg-pink-100 px-2 py-1 rounded-full">{b.age}</span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                            <span><span className="text-gray-500">Gender:</span> <span className="capitalize font-medium">{b.gender || '-'}</span></span>
                            <span><span className="text-gray-500">Blood:</span> <span className="font-medium">{b.bloodType || '-'}</span></span>
                            <span><span className="text-gray-500">Weight:</span> <span className="font-medium">{b.weightKg != null ? `${b.weightKg} kg` : '-'}</span></span>
                            <span><span className="text-gray-500">Height:</span> <span className="font-medium">{b.heightCm != null ? `${b.heightCm} cm` : '-'}</span></span>
                          </div>
                        </div>
                        <Tooltip content={tooltip || 'No relations'}>
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 text-xs font-medium shrink-0 border border-pink-200">
                            {b.relations.length} {b.relations.length === 1 ? 'relation' : 'relations'}
                          </span>
                        </Tooltip>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-pink-600 text-xs font-medium hidden group-hover:inline">View</span>
                          <FaArrowRight className="text-pink-500 group-hover:text-pink-600 group-hover:translate-x-1 transition-all duration-200" />
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDelete(b.id, b.name)
                      }}
                      disabled={deletingId === b.id}
                      className={`absolute top-4 right-4 p-2 rounded-lg transition-all duration-200 ${
                        isConfirming
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      } ${deletingId === b.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isConfirming ? 'Click again to confirm' : 'Delete baby'}
                    >
                      {deletingId === b.id ? (
                        <Spinner size={16} />
                      ) : (
                        <FaTrash className="text-sm" />
                      )}
                    </button>
                    {isConfirming && (
                      <div className="mt-3 pt-3 border-t border-pink-200">
                        <p className="text-xs text-red-600 font-medium mb-2">Are you sure? This cannot be undone.</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b-2 border-pink-100">
                    <th className="py-4 pr-4 font-semibold">Avatar</th>
                    <th className="py-4 pr-4 font-semibold">Name</th>
                    <th className="py-4 pr-4 font-semibold">Age</th>
                    <th className="py-4 pr-4 font-semibold">Gender</th>
                    <th className="py-4 pr-4 font-semibold">Blood Type</th>
                    <th className="py-4 pr-4 font-semibold">Weight (kg)</th>
                    <th className="py-4 pr-4 font-semibold">Height (cm)</th>
                    <th className="py-4 pr-4 font-semibold">Relations</th>
                    <th className="py-4 pr-4 font-semibold">View</th>
                    <th className="py-4 pr-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {babies.map(b => {
                    const tooltip = b.relations.map(r => `${r.name} ${r.relationship?.charAt(0).toUpperCase()}${r.relationship?.slice(1)}`).join('\n')
                    const isConfirming = confirmDeleteId === b.id
                    return (
                      <tr 
                        key={b.id} 
                        onClick={() => router.push(`/dashboard/babies/${b.id}`)}
                        className="border-b border-pink-50 hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-rose-50/50 transition-all duration-200 cursor-pointer group"
                      >
                        <td className="py-4 pr-4">
                          <div className="relative">
                            <img
                              src={b.avatar}
                              alt={b.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-pink-200 shadow-sm"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-pink-400 rounded-full border-2 border-white"></div>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                            {b.name}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-medium">
                            {b.age}
                          </span>
                        </td>
                        <td className="py-4 pr-4 capitalize font-medium">{b.gender || '-'}</td>
                        <td className="py-4 pr-4 font-medium">{b.bloodType || '-'}</td>
                        <td className="py-4 pr-4 font-medium">{b.weightKg != null ? b.weightKg : '-'}</td>
                        <td className="py-4 pr-4 font-medium">{b.heightCm != null ? b.heightCm : '-'}</td>
                        <td className="py-4 pr-4" onClick={(e) => e.stopPropagation()}>
                          <Tooltip content={tooltip || 'No relations'}>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 text-xs font-medium border border-pink-200">
                              {b.relations.length} {b.relations.length === 1 ? 'relation' : 'relations'}
                            </span>
                          </Tooltip>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2 text-pink-600 group-hover:text-pink-700 font-medium">
                            <FaEye className="text-sm" />
                            <span className="text-sm hidden sm:inline">View</span>
                            <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform duration-200" />
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {isConfirming ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(b.id, b.name)
                                  }}
                                  disabled={deletingId === b.id}
                                  className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                  {deletingId === b.id ? 'Deleting...' : 'Confirm'}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setConfirmDeleteId(null)
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setConfirmDeleteId(b.id)
                                }}
                                disabled={deletingId === b.id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete baby"
                              >
                                {deletingId === b.id ? (
                                  <Spinner size={16} />
                                ) : (
                                  <FaTrash className="text-sm" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 rounded-2xl p-8 sm:p-12 border border-dashed border-pink-200 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center shadow-lg">
                <FaBaby className="text-white text-3xl" />
              </div>
              <p className="text-gray-800 font-semibold text-lg mb-2">No babies added yet</p>
              <p className="text-gray-600 text-sm mb-6">Add your baby to start tracking and getting insights.</p>
              <Link
                href="/dashboard/babies/add-baby"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <FaPlus className="text-sm" />
                Add Your First Baby
              </Link>
            </div>
          </div>
        )
        }
      </div>
  )
}

function formatAge(birthDateISO: string): string {
  try {
    const bd = new Date(birthDateISO)
    const now = new Date()
    const months = (now.getFullYear() - bd.getFullYear()) * 12 + (now.getMonth() - bd.getMonth())
    if (months <= 0) return 'Newborn'
    if (months < 12) return `${months} month${months === 1 ? '' : 's'}`
    const years = Math.floor(months / 12)
    const remMonths = months % 12
    return remMonths ? `${years}y ${remMonths}m` : `${years}y`
  } catch {
    return ''
  }
}


