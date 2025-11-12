'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Spinner from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip } from '@/components/ui/tooltip'

interface Baby {
  id: string
  name: string
  age: string
  avatar: string
  lastCry: Date
  totalCries: number
}

export default function BabiesPage() {
  const [babies, setBabies] = useState<(Baby & { relations: { name: string; relationship: string }[]; gender?: string | null; bloodType?: string | null; weightKg?: number | null; heightCm?: number | null })[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="w-full space-y-6">
      {/* Page hero */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Babies</h1>
            <p className="text-gray-600 text-sm mt-1">Manage your babies, view relations, and jump into details.</p>
          </div>
          <div className="w-full sm:w-auto">
            <Link
              href="/dashboard/babies/add-baby"
              className="mt-2 sm:mt-0 inline-flex w-full sm:w-auto items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
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
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100">
            {/* Mobile: cards */}
            <div className="md:hidden space-y-3">
              {babies.map(b => {
                const tooltip = b.relations.map(r => `${r.name} ${r.relationship?.charAt(0).toUpperCase()}${r.relationship?.slice(1)}`).join('\n')
                return (
                  <Link
                    key={b.id}
                    href={`/dashboard/babies/${b.id}`}
                    className="block border border-gray-100 rounded-lg p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={b.avatar}
                        alt={b.name}
                        className="w-12 h-12 rounded-full object-cover border"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 truncate">{b.name}</p>
                          <span className="text-xs text-gray-500 ml-2 shrink-0">{b.age}</span>
                        </div>
                        <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                          <span><span className="text-gray-500">Gender:</span> <span className="capitalize">{b.gender || '-'}</span></span>
                          <span><span className="text-gray-500">Blood:</span> {b.bloodType || '-'}</span>
                          <span><span className="text-gray-500">Weight:</span> {b.weightKg != null ? `${b.weightKg} kg` : '-'}</span>
                          <span><span className="text-gray-500">Height:</span> {b.heightCm != null ? `${b.heightCm} cm` : '-'}</span>
                        </div>
                      </div>
                      <Tooltip content={tooltip || 'No relations'}>
                        <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs shrink-0">
                          {b.relations.length}
                        </span>
                      </Tooltip>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 pr-4">Avatar</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Age</th>
                    <th className="py-2 pr-4">Gender</th>
                    <th className="py-2 pr-4">Blood Type</th>
                    <th className="py-2 pr-4">Weight (kg)</th>
                    <th className="py-2 pr-4">Height (cm)</th>
                    <th className="py-2 pr-4">Relations</th>
                  </tr>
                </thead>
                <tbody>
                  {babies.map(b => {
                    const tooltip = b.relations.map(r => `${r.name} ${r.relationship?.charAt(0).toUpperCase()}${r.relationship?.slice(1)}`).join('\n')
                    return (
                      <tr key={b.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => (window.location.href = `/dashboard/babies/${b.id}`)}>
                        <td className="py-2 pr-4">
                          <img
                            src={b.avatar}
                            alt={b.name}
                            className="w-8 h-8 rounded-full object-cover border"
                          />
                        </td>
                        <td className="py-2 pr-4 font-medium text-gray-900">{b.name}</td>
                        <td className="py-2 pr-4">{b.age}</td>
                        <td className="py-2 pr-4 capitalize">{b.gender || '-'}</td>
                        <td className="py-2 pr-4">{b.bloodType || '-'}</td>
                        <td className="py-2 pr-4">{b.weightKg != null ? b.weightKg : '-'}</td>
                        <td className="py-2 pr-4">{b.heightCm != null ? b.heightCm : '-'}</td>
                        <td className="py-2 pr-4">
                          <Tooltip content={tooltip || 'No relations'}>
                            <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700">
                              {b.relations.length}
                            </span>
                          </Tooltip>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 border border-dashed border-gray-200 text-center">
            <p className="text-gray-700 font-medium">No babies added yet</p>
            <p className="text-gray-500 text-sm mt-1">Add your baby to start tracking and getting insights.</p>
            <Link
              href="/dashboard/babies/add-baby"
              className="mt-4 inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Add Baby
            </Link>
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


