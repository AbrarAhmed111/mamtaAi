'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FaDownload, FaEye, FaHeart, FaStar, FaArrowLeft, FaCheckCircle, FaFile } from 'react-icons/fa'
import Image from 'next/image'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Resource {
  id: string
  title: string
  description: string | null
  file_url: string
  file_name: string
  file_size_bytes: number | null
  file_type: string | null
  resource_type: string
  category: string
  subcategory: string | null
  age_group: string | null
  tags: string[] | null
  download_count: number | null
  view_count: number | null
  like_count: number | null
  rating_average: number | null
  rating_count: number | null
  is_verified: boolean | null
  created_at: string | null
  uploader: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

export default function ResourcePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    loadResource()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const loadResource = async () => {
    try {
      const res = await fetch(`/api/community/resources/${id}`)
      const data = await res.json()
      if (data.resource) {
        setResource(data.resource)
      } else {
        toast.error('Resource not found')
        router.push('/dashboard/community')
      }
    } catch (error) {
      toast.error('Failed to load resource')
      router.push('/dashboard/community')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/community/resources/${id}/download`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        // Open download URL in new tab
        window.open(data.download_url, '_blank')
        toast.success('Download started!')
        loadResource() // Refresh to update download count
      } else {
        toast.error('Failed to initiate download')
      }
    } catch (error) {
      toast.error('Failed to download')
    } finally {
      setDownloading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size'
    const mb = bytes / (1024 * 1024)
    if (mb < 1) {
      const kb = bytes / 1024
      return `${kb.toFixed(1)} KB`
    }
    return `${mb.toFixed(1)} MB`
  }

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FaFile />
    const type = fileType.toLowerCase()
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('doc')) return '📝'
    if (type.includes('excel') || type.includes('xls')) return '📊'
    if (type.includes('image')) return '🖼️'
    if (type.includes('video')) return '🎥'
    return <FaFile />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  if (!resource) {
    return null
  }

  return (
    <div className="w-full">
      <div className="max-w-full mx-auto">
        {/* Back Button */}
        <Link
          href="/dashboard/community?tab=resources"
          className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 mb-6"
        >
          <FaArrowLeft />
          Back to Resources
        </Link>

        {/* Resource Content */}
        <article className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              {resource.is_verified && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded flex items-center gap-1">
                  <FaCheckCircle /> Verified
                </span>
              )}
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded">
                {resource.resource_type}
              </span>
              <span className="px-3 py-1 bg-pink-100 text-pink-700 text-sm font-semibold rounded">
                {resource.category}
              </span>
              {resource.age_group && resource.age_group !== 'all' && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded">
                  {resource.age_group}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {resource.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
              {resource.uploader && (
                <div className="flex items-center gap-2">
                  {resource.uploader.avatar_url ? (
                    <Image
                      src={resource.uploader.avatar_url}
                      alt={resource.uploader.full_name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover h-10 w-10"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center">
                      {resource.uploader.full_name[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">{resource.uploader.full_name}</div>
                    <div className="text-xs text-gray-500">{formatDate(resource.created_at)}</div>
                  </div>
                </div>
              )}
            </div>

            {resource.description && (
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 leading-relaxed">{resource.description}</p>
              </div>
            )}

            {/* File Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{getFileIcon(resource.file_type)}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">{resource.file_name}</div>
                  <div className="text-sm text-gray-600">
                    {formatFileSize(resource.file_size_bytes)} • {resource.file_type || 'Unknown type'}
                  </div>
                </div>
              </div>
            </div>

            {resource.tags && resource.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {resource.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Stats and Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FaDownload />
                  <span>{resource.download_count || 0} downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaEye />
                  <span>{resource.view_count || 0} views</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaHeart />
                  <span>{resource.like_count || 0} likes</span>
                </div>
                {resource.rating_average && (
                  <div className="flex items-center gap-2">
                    <FaStar className="text-yellow-500" />
                    <span>
                      {resource.rating_average.toFixed(1)} ({resource.rating_count || 0} ratings)
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <FaDownload />
                {downloading ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}

