'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FaArrowLeft, FaTag } from 'react-icons/fa'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function CreateForumThreadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    tags: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/community/forum/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to load categories')
    }
  }

  const validateTitle = (title: string): string => {
    const trimmed = title.trim()
    if (!trimmed) {
      return 'Title is required'
    }
    if (trimmed.length < 10) {
      return 'Title must be at least 10 characters'
    }
    if (trimmed.length > 200) {
      return 'Title must be 200 characters or less'
    }
    if (/[<>{}[\]\\]/.test(trimmed)) {
      return 'Title contains invalid characters'
    }
    return ''
  }

  const validateContent = (content: string): string => {
    const trimmed = content.trim()
    if (!trimmed) {
      return 'Content is required'
    }
    if (trimmed.length < 50) {
      return 'Content must be at least 50 characters'
    }
    if (trimmed.length > 10000) {
      return 'Content must be 10,000 characters or less'
    }
    return ''
  }

  const validateCategory = (categoryId: string): string => {
    if (!categoryId) {
      return 'Category is required'
    }
    // Check if it's a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(categoryId)) {
      return 'Please select a valid category'
    }
    // Check if category exists in loaded categories
    if (categories.length > 0 && !categories.some(cat => cat.id === categoryId)) {
      return 'Please select a valid category'
    }
    return ''
  }

  const validateTags = (tags: string): string => {
    if (!tags.trim()) return ''
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    if (tagsArray.length > 10) {
      return 'Maximum 10 tags allowed'
    }
    for (const tag of tagsArray) {
      if (tag.length > 30) {
        return 'Each tag must be 30 characters or less'
      }
      if (!/^[a-zA-Z0-9\s-]+$/.test(tag)) {
        return 'Tags can only contain letters, numbers, spaces, and hyphens'
      }
    }
    return ''
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    newErrors.title = validateTitle(formData.title)
    newErrors.content = validateContent(formData.content)
    newErrors.category_id = validateCategory(formData.category_id)
    newErrors.tags = validateTags(formData.tags)

    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      const firstError = Object.values(errors).find(err => err)
      if (firstError) {
        toast.error(firstError)
      }
      return
    }

    setLoading(true)
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const res = await fetch('/api/community/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          category_id: formData.category_id,
          tags: tagsArray,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Thread created successfully!')
        router.push(`/dashboard/community/forums/${data.thread.id}`)
      } else {
        toast.error(data.error || 'Failed to create thread')
      }
    } catch (error) {
      toast.error('Failed to create thread')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-full mx-auto">
      <Link
        href="/dashboard/community?tab=forums"
        className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 mb-6"
      >
        <FaArrowLeft />
        Back to Forums
      </Link>

      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Start a Discussion</h1>
        <p className="text-gray-600 mb-6">Ask a question, share a tip, or start a conversation with other parents</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value })
                if (errors.title) {
                  setErrors({ ...errors, title: validateTitle(e.target.value) })
                }
              }}
              onBlur={() => setErrors({ ...errors, title: validateTitle(formData.title) })}
              placeholder="e.g., Sleep training tips for 6-month-old?"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-pink-200'
              }`}
              required
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 characters (minimum 10)</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => {
                setFormData({ ...formData, category_id: e.target.value })
                if (errors.category_id) {
                  setErrors({ ...errors, category_id: validateCategory(e.target.value) })
                }
              }}
              onBlur={() => setErrors({ ...errors, category_id: validateCategory(formData.category_id) })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                errors.category_id ? 'border-red-500' : 'border-pink-200'
              }`}
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Question or Discussion <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => {
                setFormData({ ...formData, content: e.target.value })
                if (errors.content) {
                  setErrors({ ...errors, content: validateContent(e.target.value) })
                }
              }}
              onBlur={() => setErrors({ ...errors, content: validateContent(formData.content) })}
              placeholder="Provide details about your question or topic. Include relevant information like your baby's age, what you've tried, or specific challenges you're facing..."
              rows={10}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-sans ${
                errors.content ? 'border-red-500' : 'border-pink-200'
              }`}
              required
            />
            {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
            <p className="text-xs text-gray-500 mt-1">{formData.content.length}/10,000 characters (minimum 50)</p>
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
              onChange={(e) => {
                setFormData({ ...formData, tags: e.target.value })
                if (errors.tags) {
                  setErrors({ ...errors, tags: validateTags(e.target.value) })
                }
              }}
              onBlur={() => setErrors({ ...errors, tags: validateTags(formData.tags) })}
              placeholder="e.g., sleep, 6months, tips (separate with commas)"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                errors.tags ? 'border-red-500' : 'border-pink-200'
              }`}
            />
            {errors.tags && <p className="text-red-500 text-xs mt-1">{errors.tags}</p>}
            <p className="text-xs text-gray-500 mt-1">Separate tags with commas (max 10 tags, 30 chars each)</p>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/dashboard/community?tab=forums"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 transition-all"
            >
              {loading ? 'Creating...' : 'Create Thread'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}



