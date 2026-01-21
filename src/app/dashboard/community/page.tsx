'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { FaBook, FaComments, FaFolderOpen, FaPlus, FaSearch, FaFilter, FaEye, FaComment, FaDownload, FaStar, FaCheckCircle } from 'react-icons/fa'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'

type Tab = 'blog' | 'forums' | 'resources'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featured_image_url: string | null
  category: string
  view_count: number | null
  like_count: number | null
  comment_count: number | null
  bookmark_count: number | null
  is_expert_content: boolean | null
  published_at: string | null
  author: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

interface ForumThread {
  id: string
  title: string
  view_count: number | null
  reply_count: number | null
  like_count: number | null
  is_pinned: boolean | null
  is_solved: boolean | null
  last_activity_at: string | null
  category: {
    id: string
    name: string
    icon: string | null
    color_hex: string | null
  } | null
  author: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

interface Resource {
  id: string
  title: string
  description: string | null
  resource_type: string
  category: string
  download_count: number | null
  view_count: number | null
  like_count: number | null
  rating_average: number | null
  is_verified: boolean | null
  file_type: string | null
  uploader: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

export default function CommunityPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('blog')
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [forumThreads, setForumThreads] = useState<ForumThread[]>([])
  const [forumCategories, setForumCategories] = useState<any[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  // Initialize tab from URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['blog', 'forums', 'resources'].includes(tabParam)) {
      setActiveTab(tabParam as Tab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    loadData()
    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedCategory])

  useEffect(() => {
    if (user) {
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadUser = async () => {
    try {
      const res = await fetch('/api/me')
      const data = await res.json()
      setUser(data)
    } catch (error) {
      console.error('Failed to load user')
    }
  }


  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'blog') {
        const params = new URLSearchParams()
        if (selectedCategory) params.append('category', selectedCategory)
        const res = await fetch(`/api/community/blog?${params}`)
        const data = await res.json()
        setBlogPosts(data.posts || [])
      } else if (activeTab === 'forums') {
        const [threadsRes, categoriesRes] = await Promise.all([
          fetch(`/api/community/forum/threads${selectedCategory ? `?category_id=${selectedCategory}` : ''}`),
          fetch('/api/community/forum/categories')
        ])
        const threadsData = await threadsRes.json()
        const categoriesData = await categoriesRes.json()
        setForumThreads(threadsData.threads || [])
        setForumCategories(categoriesData.categories || [])
      } else if (activeTab === 'resources') {
        const params = new URLSearchParams()
        if (selectedCategory) params.append('category', selectedCategory)
        const res = await fetch(`/api/community/resources?${params}`)
        const data = await res.json()
        setResources(data.resources || [])
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const filteredBlogPosts = blogPosts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredForumThreads = forumThreads.filter(thread =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  return (
    <div className="w-full">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
              Community Hub
            </h1>
            <p className="text-gray-600">Connect, share, and learn with other parents</p>
          </div>
          <Link
            href="/dashboard/community/guidelines"
            className="px-4 py-2 text-sm bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors"
          >
            📖 Guidelines
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-pink-200">
          <button
            onClick={() => {
              setActiveTab('blog')
              setSelectedCategory(null)
              router.push('/dashboard/community?tab=blog')
            }}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'blog'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-600 hover:text-pink-600'
            }`}
          >
            <FaBook className="inline mr-2" />
            Blog
          </button>
          <button
            onClick={() => {
              setActiveTab('forums')
              setSelectedCategory(null)
              router.push('/dashboard/community?tab=forums')
            }}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'forums'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-600 hover:text-pink-600'
            }`}
          >
            <FaComments className="inline mr-2" />
            Forums
          </button>
          <button
            onClick={() => {
              setActiveTab('resources')
              setSelectedCategory(null)
              router.push('/dashboard/community?tab=resources')
            }}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'resources'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-600 hover:text-pink-600'
            }`}
          >
            <FaFolderOpen className="inline mr-2" />
            Resources
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          {activeTab === 'forums' && forumCategories.length > 0 && (
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">All Categories</option>
              {forumCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex gap-2">
            <Link
              href={`/dashboard/community/${activeTab}/create`}
              className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all flex items-center gap-2"
            >
              <FaPlus />
              Create New
            </Link>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        ) : (
          <>
            {/* Blog Posts */}
            {activeTab === 'blog' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBlogPosts.length === 0 ? (
                  <div className="col-span-full">
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-8 text-center mb-6">
                      <FaBook className="text-5xl text-pink-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No blog posts yet</h3>
                      <p className="text-gray-600 mb-4">Be the first to share your parenting journey!</p>
                      <div className="bg-white rounded-lg p-4 text-left max-w-2xl mx-auto">
                        <p className="text-sm font-semibold text-gray-900 mb-2">💡 Great blog post ideas:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Personal experiences and lessons learned</li>
                          <li>• Step-by-step how-to guides</li>
                          <li>• Product reviews and recommendations</li>
                          <li>• Milestone celebrations and tips</li>
                          <li>• Health & wellness advice</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  filteredBlogPosts.map((post) => {
                    return (
                      <div
                        key={post.id}
                        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group flex flex-col relative"
                      >
                        <Link
                          href={`/dashboard/community/blog/${post.id}`}
                          className="flex flex-col flex-1"
                        >
                          {post.featured_image_url && (
                            <div className="relative h-48 w-full overflow-hidden">
                              <Image
                                src={post.featured_image_url}
                                alt={post.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                          )}
                          <div className="p-6 flex flex-col flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {post.is_expert_content && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                                  Expert
                                </span>
                              )}
                              <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs font-semibold rounded">
                                {post.category}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
                              {post.title}
                            </h3>
                            {post.excerpt && (
                              <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">{post.excerpt}</p>
                            )}
                            <div className="flex items-center justify-between text-sm text-gray-500 mt-auto pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <FaEye /> {post.view_count || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                </span>
                                <span className="flex items-center gap-1">
                                  <FaComment /> {post.comment_count || 0}
                                </span>
                              </div>
                              {post.author && (
                                <div className="flex items-center gap-2">
                                  {post.author.avatar_url ? (
                                    <Image
                                      src={post.author.avatar_url}
                                      alt={post.author.full_name}
                                      width={24}
                                      height={24}
                                      className="rounded-full object-cover h-10 w-10"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center text-xs">
                                      {post.author.full_name[0]}
                                    </div>
                                  )}
                                  <span className="text-xs">{post.author.full_name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* Forum Threads */}
            {activeTab === 'forums' && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {filteredForumThreads.length === 0 ? (
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-8 text-center">
                    <FaComments className="text-5xl text-pink-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No discussions yet</h3>
                    <p className="text-gray-600 mb-4">Start a conversation and connect with other parents!</p>
                    <div className="bg-white rounded-lg p-4 text-left max-w-2xl mx-auto">
                      <p className="text-sm font-semibold text-gray-900 mb-2">💬 Great forum topics:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Ask questions and seek advice</li>
                        <li>• Share quick tips and solutions</li>
                        <li>• Discuss common challenges</li>
                        <li>• Recommend local resources</li>
                        <li>• Start general parenting discussions</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredForumThreads.map((thread) => (
                      <Link
                        key={thread.id}
                        href={`/dashboard/community/forums/${thread.id}`}
                        className="block p-6 hover:bg-pink-50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {thread.category && (
                            <div
                              className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                              style={{
                                backgroundColor: thread.category.color_hex || '#ec4899',
                              }}
                            >
                              {thread.category.icon || '💬'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {thread.is_pinned && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                                  Pinned
                                </span>
                              )}
                              {thread.is_solved && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded flex items-center gap-1">
                                  <FaCheckCircle /> Solved
                                </span>
                              )}
                              <span className="text-sm text-gray-500">
                                {thread.category?.name || 'General'}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-pink-600 transition-colors">
                              {thread.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <FaEye /> {thread.view_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <FaComment /> {thread.reply_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                              </span>
                              {thread.author && (
                                <div className="flex items-center gap-2 ml-auto">
                                  {thread.author.avatar_url ? (
                                    <Image
                                      src={thread.author.avatar_url}
                                      alt={thread.author.full_name}
                                      width={20}
                                      height={20}
                                      className="rounded-full object-cover h-10 w-10"
                                    />
                                  ) : (
                                    <div className=" bg-pink-200 rounded-full flex items-center justify-center text-xs">
                                      {thread.author.full_name[0]}
                                    </div>
                                  )}
                                  <span>{thread.author.full_name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Resources */}
            {activeTab === 'resources' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.length === 0 ? (
                  <div className="col-span-full">
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-8 text-center mb-6">
                      <FaFolderOpen className="text-5xl text-pink-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No resources yet</h3>
                      <p className="text-gray-600 mb-4">Share helpful files and documents with the community!</p>
                      <div className="bg-white rounded-lg p-4 text-left max-w-2xl mx-auto">
                        <p className="text-sm font-semibold text-gray-900 mb-2">📁 Great resources to share:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Checklists (feeding, milestones, packing lists)</li>
                          <li>• Templates and guides</li>
                          <li>• Worksheets and activity sheets</li>
                          <li>• Infographics and visual guides</li>
                          <li>• Schedules and planning documents</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  filteredResources.map((resource) => (
                    <Link
                      key={resource.id}
                      href={`/dashboard/community/resources/${resource.id}`}
                      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group"
                    >
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          {resource.is_verified && (
                            <FaCheckCircle className="text-green-500" title="Verified" />
                          )}
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                            {resource.resource_type}
                          </span>
                          <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs font-semibold rounded">
                            {resource.category}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
                          {resource.title}
                        </h3>
                        {resource.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{resource.description}</p>
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <FaDownload /> {resource.download_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaEye /> {resource.view_count || 0}
                            </span>
                            {resource.rating_average && (
                              <span className="flex items-center gap-1">
                                <FaStar className="text-yellow-500" /> {resource.rating_average.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        {resource.uploader && (
                          <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                            {resource.uploader.avatar_url ? (
                              <Image
                                src={resource.uploader.avatar_url}
                                alt={resource.uploader.full_name}
                                width={24}
                                height={24}
                                className="rounded-full object-cover h-10 w-10"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-pink-200 rounded-full flex items-center justify-center text-xs">
                                {resource.uploader.full_name[0]}
                              </div>
                            )}
                            <span className="text-xs text-gray-600">{resource.uploader.full_name}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

