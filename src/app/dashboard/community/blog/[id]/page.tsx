'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FaHeart, FaComment, FaEye, FaArrowLeft, FaEdit, FaTrash, FaReply } from 'react-icons/fa'
import Image from 'next/image'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface BlogPost {
  id: string
  title: string
  content: string
  excerpt: string | null
  featured_image_url: string | null
  category: string
  subcategory: string | null
  tags: string[] | null
  view_count: number | null
  like_count: number | null
  comment_count: number | null
  is_expert_content: boolean | null
  author_credentials: string | null
  published_at: string | null
  created_at: string | null
  author: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

interface Comment {
  id: string
  content: string
  like_count: number | null
  created_at: string | null
  author: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
  parent_comment_id: string | null
}

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [post, setPost] = useState<BlogPost | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentContent, setCommentContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadPost()
    loadComments()
    loadUser()
  }, [id])

  const loadUser = async () => {
    try {
      const res = await fetch('/api/me')
      const data = await res.json()
      setUser(data)
    } catch (error) {
      console.error('Failed to load user')
    }
  }

  const loadPost = async () => {
    try {
      const res = await fetch(`/api/community/blog/${id}`)
      const data = await res.json()
      if (data.post) {
        setPost(data.post)
      } else {
        toast.error('Post not found')
        router.push('/dashboard/community')
      }
    } catch (error) {
      toast.error('Failed to load post')
      router.push('/dashboard/community')
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/community/blog/${id}/comments`)
      const data = await res.json()
      setComments(data.comments || [])
    } catch (error) {
      console.error('Failed to load comments')
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/community/blog/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentContent }),
      })

      if (res.ok) {
        setCommentContent('')
        toast.success('Comment added!')
        loadComments()
        loadPost() // Refresh to update comment count
      } else {
        toast.error('Failed to add comment')
      }
    } catch (error) {
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  if (!post) {
    return null
  }

  const isAuthor = user?.id === post.author?.id

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/dashboard/community"
          className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 mb-6"
        >
          <FaArrowLeft />
          Back to Community
        </Link>

        {/* Post Content */}
        <article className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          {post.featured_image_url && (
            <div className="relative h-64 md:h-96 w-full">
              <Image
                src={post.featured_image_url}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              {post.is_expert_content && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded">
                  Expert Content
                </span>
              )}
              <span className="px-3 py-1 bg-pink-100 text-pink-700 text-sm font-semibold rounded">
                {post.category}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
              {post.author && (
                <div className="flex items-center gap-2">
                  {post.author.avatar_url ? (
                    <Image
                      src={post.author.avatar_url}
                      alt={post.author.full_name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover h-10 w-10"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center">
                      {post.author.full_name[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">{post.author.full_name}</div>
                    {post.author_credentials && (
                      <div className="text-xs text-gray-500">{post.author_credentials}</div>
                    )}
                  </div>
                </div>
              )}
              <span className="text-gray-400">•</span>
              <span>{formatDate(post.published_at || post.created_at)}</span>
            </div>

            <div className="prose max-w-none mb-6">
              <div
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
              />
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-6 pt-6 border-t border-gray-200">
              <button className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors">
                <FaHeart />
                <span>{post.like_count || 0}</span>
              </button>
              <div className="flex items-center gap-2 text-gray-600">
                <FaComment />
                <span>{post.comment_count || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FaEye />
                <span>{post.view_count || 0}</span>
              </div>
              {isAuthor && (
                <div className="ml-auto flex gap-2">
                  <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                    <FaEdit className="inline mr-1" />
                    Edit
                  </button>
                  <button className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                    <FaTrash className="inline mr-1" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          {user && (
            <form onSubmit={handleSubmitComment} className="mb-8">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Write a comment..."
                rows={4}
                className="w-full p-4 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent mb-4"
              />
              <button
                type="submit"
                disabled={submitting || !commentContent.trim()}
                className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 transition-all"
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-start gap-4">
                    {comment.author && (
                      <>
                        {comment.author.avatar_url ? (
                          <Image
                            src={comment.author.avatar_url}
                            alt={comment.author.full_name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0">
                            {comment.author.full_name[0]}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">
                              {comment.author.full_name}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{comment.content}</p>
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-1 text-gray-600 hover:text-pink-600 text-sm">
                              <FaHeart />
                              <span>{comment.like_count || 0}</span>
                            </button>
                            <button className="flex items-center gap-1 text-gray-600 hover:text-pink-600 text-sm">
                              <FaReply />
                              Reply
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

