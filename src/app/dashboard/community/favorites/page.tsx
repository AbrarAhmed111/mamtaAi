'use client'

import { useState, useEffect } from 'react'
import { FaBook, FaBookmark, FaHeart, FaComment, FaEye, FaArrowLeft } from 'react-icons/fa'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'

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

export default function FavoritesPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadUser()
    loadFavorites()
  }, [])

  const loadUser = async () => {
    try {
      const res = await fetch('/api/me')
      const data = await res.json()
      setUser(data)
    } catch (error) {
      console.error('Failed to load user')
    }
  }

  const loadFavorites = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/community/blog/favorites')
      const data = await res.json()
      if (data.posts) {
        setPosts(data.posts)
      }
    } catch (error) {
      toast.error('Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/blog/${postId}/favorite`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Removed from favorites')
        loadFavorites() // Reload the list
      } else {
        toast.error('Failed to remove favorite')
      }
    } catch (error) {
      toast.error('Failed to remove favorite')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/community"
            className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 mb-4"
          >
            <FaArrowLeft />
            Back to Community
          </Link>
          <div className="flex items-center gap-3">
            <FaBookmark className="text-4xl text-pink-600" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                My Favorites
              </h1>
              <p className="text-gray-600 mt-1">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'} saved for later
              </p>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-12 text-center">
            <FaBookmark className="text-6xl text-pink-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-6">
              Start saving posts you want to reference later!
            </p>
            <Link
              href="/dashboard/community"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all"
            >
              <FaBook />
              Browse Blog Posts
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group flex flex-col relative"
              >
                {/* Remove Favorite Button */}
                <button
                  onClick={() => handleRemoveFavorite(post.id)}
                  className="absolute top-4 right-4 z-10 p-2 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition-colors"
                  title="Remove from favorites"
                >
                  <FaBookmark className="fill-current" />
                </button>

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
                          <FaHeart /> {post.like_count || 0}
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


