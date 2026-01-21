'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaArrowLeft, FaTag, FaUpload, FaFile } from 'react-icons/fa'
import Link from 'next/link'
import toast from 'react-hot-toast'

const resourceTypes = [
  { value: 'guide', label: 'Guide' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'template', label: 'Template' },
  { value: 'ebook', label: 'E-book' },
  { value: 'infographic', label: 'Infographic' },
  { value: 'worksheet', label: 'Worksheet' },
  { value: 'other', label: 'Other' },
]

const categories = [
  'Feeding',
  'Sleep',
  'Health',
  'Development',
  'Activities',
  'Planning',
  'Tracking',
  'Education',
  'Other'
]

const ageGroups = [
  { value: 'all', label: 'All Ages' },
  { value: 'newborn', label: 'Newborn (0-1 month)' },
  { value: '0-3months', label: '0-3 Months' },
  { value: '3-6months', label: '3-6 Months' },
  { value: '6-12months', label: '6-12 Months' },
  { value: '1-2years', label: '1-2 Years' },
]

export default function CreateResourcePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file_url: '',
    file_name: '',
    file_size_bytes: null as number | null,
    file_type: '',
    mime_type: '',
    resource_type: '',
    category: '',
    subcategory: '',
    age_group: 'all',
    tags: '',
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB')
      return
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'text/plain',
    ]
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not allowed. Allowed: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TXT')
      return
    }

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      
      const res = await fetch('/api/uploads/resource', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await res.json()

      if (res.ok && data.url) {
        setFormData({
          ...formData,
          file_name: data.file_name || file.name,
          file_size_bytes: data.file_size_bytes || file.size,
          file_type: data.file_type || file.type.split('/')[1] || 'unknown',
          mime_type: data.mime_type || file.type,
          file_url: data.url,
        })
        toast.success('File uploaded successfully!')
      } else {
        toast.error(data.error || 'Failed to upload file')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title || !formData.title.trim()) {
      toast.error('Title is required')
      return
    }
    
    if (formData.title.trim().length < 5) {
      toast.error('Title must be at least 5 characters')
      return
    }
    
    if (formData.title.trim().length > 200) {
      toast.error('Title must be 200 characters or less')
      return
    }
    
    if (!formData.file_url || !formData.file_name) {
      toast.error('Please upload a file')
      return
    }
    
    if (!formData.resource_type) {
      toast.error('Please select a resource type')
      return
    }
    
    if (!formData.category) {
      toast.error('Please select a category')
      return
    }

    setLoading(true)
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
      
      // Validate tags
      if (tagsArray.length > 10) {
        toast.error('Maximum 10 tags allowed')
        setLoading(false)
        return
      }
      
      for (const tag of tagsArray) {
        if (tag.length > 30) {
          toast.error('Each tag must be 30 characters or less')
          setLoading(false)
          return
        }
      }

      const res = await fetch('/api/community/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          file_url: formData.file_url,
          file_name: formData.file_name,
          file_size_bytes: formData.file_size_bytes,
          file_type: formData.file_type,
          mime_type: formData.mime_type,
          resource_type: formData.resource_type,
          category: formData.category,
          subcategory: formData.subcategory.trim() || null,
          age_group: formData.age_group,
          tags: tagsArray,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Resource shared successfully!')
        router.push(`/dashboard/community/resources/${data.resource.id}`)
      } else {
        toast.error(data.error || 'Failed to share resource')
      }
    } catch (error) {
      toast.error('Failed to share resource')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-full mx-auto">
      <Link
        href="/dashboard/community?tab=resources"
        className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 mb-6"
      >
        <FaArrowLeft />
        Back to Resources
      </Link>

      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Share a Resource</h1>
        <p className="text-gray-600 mb-6">Upload helpful files, guides, or documents for other parents</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FaUpload className="inline mr-1" />
              File <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-pink-200 rounded-lg p-6 text-center hover:border-pink-300 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FaFile className="text-4xl text-pink-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  {formData.file_name || 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB)
                </p>
                {formData.file_size_bytes && (
                  <p className="text-xs text-pink-600 mt-2">
                    {(formData.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </label>
            </div>
            {formData.file_url && (
              <input
                type="hidden"
                value={formData.file_url}
                onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
              />
            )}
            {formData.file_url && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <FaFile className="inline" />
                File uploaded successfully
              </p>
            )}
            {uploading && (
              <p className="text-xs text-pink-600 mt-2">Uploading file...</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Newborn Feeding Schedule Checklist"
              className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this resource is, who it's for, and how to use it..."
              rows={4}
              className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Resource Type and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Resource Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.resource_type}
                onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              >
                <option value="">Select type</option>
                {resourceTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subcategory and Age Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subcategory (Optional)
              </label>
              <input
                type="text"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                placeholder="e.g., Breastfeeding, Sleep Training"
                className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Age Group
              </label>
              <select
                value={formData.age_group}
                onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                {ageGroups.map((age) => (
                  <option key={age.value} value={age.value}>
                    {age.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FaTag className="inline mr-1" />
              Tags (Optional)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., checklist, feeding, printable (separate with commas)"
              className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/dashboard/community?tab=resources"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 transition-all"
            >
              {loading ? 'Sharing...' : uploading ? 'Uploading...' : 'Share Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}



