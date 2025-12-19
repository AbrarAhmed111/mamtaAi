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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.content || !formData.category) {
      toast.error('Please fill in all required fields')
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
          tags: tagsArray,
          subcategory: formData.subcategory || null,
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
        href="/dashboard/community"
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
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., 5 Tips for Better Sleep with a Newborn"
              className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Short Summary
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="A brief 2-3 sentence summary of your post..."
              rows={3}
              className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">This will appear in the post preview</p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your blog post here... You can use line breaks to format paragraphs."
              rows={12}
              className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-sans"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Use line breaks to separate paragraphs</p>
          </div>

          {/* Category and Age Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
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
              onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
              placeholder="e.g., Breastfeeding, Sleep Training, etc."
              className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FaTag className="inline mr-1" />
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., tips, newborn, sleep, feeding (separate with commas)"
              className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
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
              onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
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
                Your Credentials
              </label>
              <input
                type="text"
                value={formData.author_credentials}
                onChange={(e) => setFormData({ ...formData, author_credentials: e.target.value })}
                placeholder="e.g., Registered Nurse, Pediatrician, Certified Lactation Consultant"
                className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/dashboard/community"
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


