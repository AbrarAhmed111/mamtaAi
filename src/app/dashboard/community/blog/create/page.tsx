'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaArrowLeft, FaImage, FaTag } from 'react-icons/fa'
import Link from 'next/link'
import toast from 'react-hot-toast'

const categories = [
  'Feeding',
  'Sleep',
  'Health',
  'Development',
  'Activities',
  'Products',
  'Tips',
  'Stories',
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

export default function CreateBlogPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    subcategory: '',
    age_group: 'all',
    featured_image_url: '',
    tags: '',
    is_expert_content: false,
    author_credentials: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    if (trimmed.length < 100) {
      return 'Content must be at least 100 characters'
    }
    if (trimmed.length > 50000) {
      return 'Content must be 50,000 characters or less'
    }
    return ''
  }

  const validateExcerpt = (excerpt: string): string => {
    if (!excerpt.trim()) return ''
    if (excerpt.length > 500) {
      return 'Excerpt must be 500 characters or less'
    }
    return ''
  }

  const validateCategory = (category: string): string => {
    if (!category) {
      return 'Category is required'
    }
    if (!categories.includes(category)) {
      return 'Please select a valid category'
    }
    return ''
  }

  const validateSubcategory = (subcategory: string): string => {
    if (!subcategory.trim()) return ''
    if (subcategory.length > 100) {
      return 'Subcategory must be 100 characters or less'
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

  const validateImageUrl = (url: string): string => {
    if (!url.trim()) return ''
    try {
      const urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return 'Image URL must use http or https protocol'
      }
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      const pathname = urlObj.pathname.toLowerCase()
      if (!validExtensions.some(ext => pathname.endsWith(ext))) {
        return 'Image URL must point to a valid image file (jpg, jpeg, png, gif, webp)'
      }
    } catch {
      return 'Please enter a valid URL'
    }
    return ''
  }

  const validateCredentials = (credentials: string, isExpert: boolean): string => {
    if (isExpert && !credentials.trim()) {
      return 'Credentials are required for expert content'
    }
    if (credentials.length > 200) {
      return 'Credentials must be 200 characters or less'
    }
    return ''
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    newErrors.title = validateTitle(formData.title)
    newErrors.content = validateContent(formData.content)
    newErrors.excerpt = validateExcerpt(formData.excerpt)
    newErrors.category = validateCategory(formData.category)
    newErrors.subcategory = validateSubcategory(formData.subcategory)
    newErrors.tags = validateTags(formData.tags)
    newErrors.featured_image_url = validateImageUrl(formData.featured_image_url)
    newErrors.author_credentials = validateCredentials(formData.author_credentials, formData.is_expert_content)

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

      const res = await fetch('/api/community/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          title: formData.title.trim(),
          content: formData.content.trim(),
          excerpt: formData.excerpt.trim() || null,
          subcategory: formData.subcategory.trim() || null,
          tags: tagsArray,
          featured_image_url: formData.featured_image_url.trim() || null,
          author_credentials: formData.author_credentials.trim() || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Blog post created successfully!')
        router.push(`/dashboard/community/blog/${data.post.id}`)
      } else {
        toast.error(data.error || 'Failed to create blog post')
      }
    } catch (error) {
      toast.error('Failed to create blog post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-full mx-auto">
      <Link
        href="/dashboard/community?tab=blog"
        className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 mb-6"
      >
        <FaArrowLeft />
        Back to Community
      </Link>

      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Write a Blog Post</h1>
        <p className="text-gray-600 mb-6">Share your parenting experiences, tips, or expertise with the community</p>

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
              placeholder="e.g., 5 Tips for Better Sleep with a Newborn"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-pink-200'
              }`}
              required
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 characters</p>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Short Summary
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => {
                setFormData({ ...formData, excerpt: e.target.value })
                if (errors.excerpt) {
                  setErrors({ ...errors, excerpt: validateExcerpt(e.target.value) })
                }
              }}
              onBlur={() => setErrors({ ...errors, excerpt: validateExcerpt(formData.excerpt) })}
              placeholder="A brief 2-3 sentence summary of your post..."
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                errors.excerpt ? 'border-red-500' : 'border-pink-200'
              }`}
            />
            {errors.excerpt && <p className="text-red-500 text-xs mt-1">{errors.excerpt}</p>}
            <p className="text-xs text-gray-500 mt-1">{formData.excerpt.length}/500 characters (optional)</p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Content <span className="text-red-500">*</span>
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
              placeholder="Write your blog post here... You can use line breaks to format paragraphs."
              rows={12}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-sans ${
                errors.content ? 'border-red-500' : 'border-pink-200'
              }`}
              required
            />
            {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
            <p className="text-xs text-gray-500 mt-1">{formData.content.length}/50,000 characters (minimum 100)</p>
          </div>

          {/* Category and Age Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value })
                  if (errors.category) {
                    setErrors({ ...errors, category: validateCategory(e.target.value) })
                  }
                }}
                onBlur={() => setErrors({ ...errors, category: validateCategory(formData.category) })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                  errors.category ? 'border-red-500' : 'border-pink-200'
                }`}
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
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

          {/* Subcategory */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subcategory (Optional)
            </label>
            <input
              type="text"
              value={formData.subcategory}
              onChange={(e) => {
                setFormData({ ...formData, subcategory: e.target.value })
                if (errors.subcategory) {
                  setErrors({ ...errors, subcategory: validateSubcategory(e.target.value) })
                }
              }}
              onBlur={() => setErrors({ ...errors, subcategory: validateSubcategory(formData.subcategory) })}
              placeholder="e.g., Breastfeeding, Sleep Training, etc."
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                errors.subcategory ? 'border-red-500' : 'border-pink-200'
              }`}
            />
            {errors.subcategory && <p className="text-red-500 text-xs mt-1">{errors.subcategory}</p>}
            <p className="text-xs text-gray-500 mt-1">{formData.subcategory.length}/100 characters</p>
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
              placeholder="e.g., tips, newborn, sleep, feeding (separate with commas)"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                errors.tags ? 'border-red-500' : 'border-pink-200'
              }`}
            />
            {errors.tags && <p className="text-red-500 text-xs mt-1">{errors.tags}</p>}
            <p className="text-xs text-gray-500 mt-1">Separate tags with commas (max 10 tags, 30 chars each)</p>
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FaImage className="inline mr-1" />
              Featured Image URL (Optional)
            </label>
            <input
              type="url"
              value={formData.featured_image_url}
              onChange={(e) => {
                setFormData({ ...formData, featured_image_url: e.target.value })
                if (errors.featured_image_url) {
                  setErrors({ ...errors, featured_image_url: validateImageUrl(e.target.value) })
                }
              }}
              onBlur={() => setErrors({ ...errors, featured_image_url: validateImageUrl(formData.featured_image_url) })}
              placeholder="https://example.com/image.jpg"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                errors.featured_image_url ? 'border-red-500' : 'border-pink-200'
              }`}
            />
            {errors.featured_image_url && <p className="text-red-500 text-xs mt-1">{errors.featured_image_url}</p>}
            <p className="text-xs text-gray-500 mt-1">Must be a valid image URL (jpg, jpeg, png, gif, webp)</p>
          </div>

          {/* Expert Content */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="expert"
              checked={formData.is_expert_content}
              onChange={(e) => setFormData({ ...formData, is_expert_content: e.target.checked })}
              className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
            />
            <label htmlFor="expert" className="text-sm font-semibold text-gray-700">
              This is expert content (I&apos;m a healthcare professional or certified expert)
            </label>
          </div>

          {formData.is_expert_content && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Credentials <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.author_credentials}
                onChange={(e) => {
                  setFormData({ ...formData, author_credentials: e.target.value })
                  if (errors.author_credentials) {
                    setErrors({ ...errors, author_credentials: validateCredentials(e.target.value, formData.is_expert_content) })
                  }
                }}
                onBlur={() => setErrors({ ...errors, author_credentials: validateCredentials(formData.author_credentials, formData.is_expert_content) })}
                placeholder="e.g., Registered Nurse, Pediatrician, Certified Lactation Consultant"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                  errors.author_credentials ? 'border-red-500' : 'border-pink-200'
                }`}
              />
              {errors.author_credentials && <p className="text-red-500 text-xs mt-1">{errors.author_credentials}</p>}
              <p className="text-xs text-gray-500 mt-1">{formData.author_credentials.length}/200 characters</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/dashboard/community?tab=blog"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 transition-all"
            >
              {loading ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}



