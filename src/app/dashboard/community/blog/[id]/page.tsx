'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FaComment, FaEye, FaArrowLeft, FaEdit, FaTrash, FaReply, FaBookmark, FaExclamationTriangle } from 'react-icons/fa'
import Image from 'next/image'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

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
  bookmark_count: number | null
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
  is_edited: boolean | null
  edited_at: string | null
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
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isFavorited, setIsFavorited] = useState(false)
  const [savedPost, setSavedPost] = useState(false)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [showDeletePostModal, setShowDeletePostModal] = useState(false)
  const [deletingPost, setDeletingPost] = useState(false)
  const hasIncrementedViewRef = useRef(false)

  useEffect(() => {
    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (id) {
      // Only increment view on initial load (check localStorage as additional safeguard)
      const viewKey = `blog_view_${id}`
      const hasViewed = typeof window !== 'undefined' && localStorage.getItem(viewKey)
      
      if (!hasIncrementedViewRef.current && !hasViewed) {
        loadPost(true) // Pass true to increment view
        hasIncrementedViewRef.current = true
        // Store in localStorage to prevent duplicate views even if page is refreshed
        if (typeof window !== 'undefined') {
          localStorage.setItem(viewKey, '1')
        }
      } else {
        loadPost(false) // Don't increment view on subsequent loads
      }
      loadComments()
      if (user) {
        loadFavoriteStatus()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user])


  // Real-time subscription for comments
  useEffect(() => {
    const channel = supabase
      .channel(`blog_comments_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blog_comments',
          filter: `post_id=eq.${id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // New comment added - reload comments to get full data with author
            loadComments()
            loadPost(false) // Update comment count, but don't increment view
          } else if (payload.eventType === 'UPDATE') {
            // Comment updated (e.g., like count changed)
            if (payload.new) {
              loadComments() // Reload to get updated data
            }
          } else if (payload.eventType === 'DELETE') {
            // Comment deleted
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id))
            loadPost(false) // Update comment count, but don't increment view
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const loadPost = async (incrementView: boolean = false) => {
    try {
      const url = incrementView 
        ? `/api/community/blog/${id}?increment_view=true`
        : `/api/community/blog/${id}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.post) {
        setPost(data.post)
        setBookmarkCount(data.post.bookmark_count || 0)
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

  const loadFavoriteStatus = async () => {
    if (!user) {
      setIsFavorited(false)
      return
    }
    try {
      const res = await fetch(`/api/community/blog/${id}/favorite`)
      const data = await res.json()
      setIsFavorited(data.is_favorited || false)
    } catch (error) {
      console.error('Failed to load favorite status')
    }
  }

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error('Please log in to save posts')
      return
    }

    try {
      const method = isFavorited ? 'DELETE' : 'POST'
      const res = await fetch(`/api/community/blog/${id}/favorite`, {
        method,
      })

      if (res.ok) {
        const newFavorited = !isFavorited
        setIsFavorited(newFavorited)
        setBookmarkCount(prev => newFavorited ? prev + 1 : Math.max(0, prev - 1))
        toast.success(newFavorited ? 'Saved to favorites!' : 'Removed from favorites')
        // Reload post to get updated bookmark count, but don't increment view
        loadPost(false)
      } else {
        toast.error('Failed to update favorite status')
      }
    } catch (error) {
      toast.error('Failed to update favorite status')
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
    if (!commentContent.trim() && !replyContent.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/community/blog/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: replyContent.trim() || commentContent.trim(),
          parent_comment_id: replyingToId || null
        }),
      })

      if (res.ok) {
        setCommentContent('')
        setReplyContent('')
        setReplyingToId(null)
        toast.success(replyingToId ? 'Reply added!' : 'Comment added!')
        loadComments()
        loadPost(false) // Refresh to update comment count, but don't increment view
      } else {
        toast.error('Failed to add comment')
      }
    } catch (error) {
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const res = await fetch(`/api/community/blog/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      })

      if (res.ok) {
        toast.success('Comment updated!')
        setEditingCommentId(null)
        setEditContent('')
        loadComments()
      } else {
        toast.error('Failed to update comment')
      }
    } catch (error) {
      toast.error('Failed to update comment')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId)
    try {
      const res = await fetch(`/api/community/blog/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Comment deleted!')
        loadComments()
        loadPost(false) // Refresh to update comment count, but don't increment view
        setDeleteCommentId(null)
      } else {
        toast.error('Failed to delete comment')
      }
    } catch (error) {
      toast.error('Failed to delete comment')
    } finally {
      setDeletingCommentId(null)
    }
  }


  const startEdit = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
  }

  const startReply = (commentId: string) => {
    setReplyingToId(commentId)
    setReplyContent('')
  }

  const cancelEdit = () => {
    setEditingCommentId(null)
    setEditContent('')
  }

  const cancelReply = () => {
    setReplyingToId(null)
    setReplyContent('')
  }

  const handleDeletePost = async () => {
    setDeletingPost(true)
    try {
      const res = await fetch(`/api/community/blog/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Blog post deleted!')
        // Go back to previous page
        router.back()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete post')
      }
    } catch (error) {
      toast.error('Failed to delete post')
    } finally {
      setDeletingPost(false)
      setShowDeletePostModal(false)
    }
  }

  // Group comments by parent
  const topLevelComments = comments.filter(c => !c.parent_comment_id)
  const getReplies = (parentId: string) => comments.filter(c => c.parent_comment_id === parentId)

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
      <div className="max-w-full mx-auto">
        {/* Delete Post Modal */}
        {showDeletePostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowDeletePostModal(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl border border-red-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FaExclamationTriangle className="text-red-600 text-xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Delete Blog Post?</h3>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete this blog post?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ Warning: This action cannot be undone. All comments and associated data will be permanently deleted.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeletePostModal(false)}
                  disabled={deletingPost}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePost}
                  disabled={deletingPost}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deletingPost ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Comment Modal */}
        {deleteCommentId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeleteCommentId(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl border border-red-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FaExclamationTriangle className="text-red-600 text-xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Delete Comment?</h3>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete this comment?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ Warning: This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteCommentId(null)}
                  disabled={deletingCommentId !== null}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteComment(deleteCommentId)}
                  disabled={deletingCommentId !== null}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deletingCommentId === deleteCommentId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <Link
          href="/dashboard/community?tab=blog"
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
              <div className="flex items-center gap-2 text-gray-600">
                <FaComment />
                <span>{post.comment_count || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FaEye />
                <span>{post.view_count || 0}</span>
              </div>
              <button
                onClick={() => {
                  setSavedPost(true)
                  setTimeout(() => setSavedPost(false), 600)
                  handleToggleFavorite()
                }}
                className={`flex items-center gap-2 transition-all duration-200 ${
                  isFavorited
                    ? 'text-pink-600 hover:text-pink-700'
                    : 'text-gray-600 hover:text-pink-600'
                } ${savedPost ? 'scale-110' : ''}`}
                title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
              >
                <FaBookmark className={`transition-all duration-200 ${isFavorited ? 'fill-current' : ''} ${savedPost ? 'animate-bounce' : ''}`} />
                <span className={`transition-all duration-200 ${savedPost ? 'scale-110 font-semibold' : ''}`}>
                  {bookmarkCount || 0}
                </span>
              </button>
              {isAuthor && (
                <div className="ml-auto flex gap-2">
                  <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                    <FaEdit className="inline mr-1" />
                    Edit
                  </button>
                  <button 
                    onClick={() => setShowDeletePostModal(true)}
                    className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
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
          {user && !replyingToId && (
            <form onSubmit={handleSubmitComment} className="mb-8">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Write a comment..."
                rows={4}
                className="w-full p-4 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent mb-4 transition-all duration-200 focus:scale-[1.01]"
              />
              <button
                type="submit"
                disabled={submitting || !commentContent.trim()}
                className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 transition-all duration-200 hover:scale-105 active:scale-95 transform"
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {topLevelComments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
            ) : (
              topLevelComments.map((comment) => {
                const isAuthor = user?.id === comment.author?.id
                const replies = getReplies(comment.id)
                const isEditing = editingCommentId === comment.id
                const isReplying = replyingToId === comment.id

                return (
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
                              {comment.is_edited && (
                                <span className="text-xs text-gray-400 italic">
                                  (edited)
                                </span>
                              )}
                            </div>
                            {isEditing ? (
                              <div className="mb-4">
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  rows={3}
                                  className="w-full p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent mb-2"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditComment(comment.id)}
                                    className="px-4 py-1 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="px-4 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-700 mb-2">{comment.content}</p>
                            )}
                            <div className="flex items-center gap-4">
                              {user && (
                                <button 
                                  onClick={() => {
                                    startReply(comment.id)
                                    // Add a subtle animation
                                    const btn = document.activeElement as HTMLElement
                                    if (btn) {
                                      btn.classList.add('animate-pulse')
                                      setTimeout(() => btn.classList.remove('animate-pulse'), 300)
                                    }
                                  }}
                                  className="flex items-center gap-1 text-gray-600 hover:text-pink-600 text-sm transition-all duration-200 hover:scale-105"
                                >
                                  <FaReply />
                                  Reply
                                </button>
                              )}
                              {isAuthor && !isEditing && (
                                <>
                                  <button 
                                    onClick={() => startEdit(comment)}
                                    className="flex items-center gap-1 text-gray-600 hover:text-blue-600 text-sm transition-colors"
                                  >
                                    <FaEdit />
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => setDeleteCommentId(comment.id)}
                                    className="flex items-center gap-1 text-gray-600 hover:text-red-600 text-sm transition-colors"
                                  >
                                    <FaTrash />
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>

                            {/* Nested Replies */}
                            {replies.length > 0 && (
                              <div className="mt-4 pl-4 border-l-2 border-pink-200 space-y-4">
                                {replies.map((reply) => {
                                  const isReplyAuthor = user?.id === reply.author?.id
                                  const isEditingReply = editingCommentId === reply.id

                                  return (
                                    <div key={reply.id} className="pb-4 border-b border-gray-100 last:border-0">
                                      <div className="flex items-start gap-3">
                                        {reply.author && (
                                          <>
                                            {reply.author.avatar_url ? (
                                              <Image
                                                src={reply.author.avatar_url}
                                                alt={reply.author.full_name}
                                                width={32}
                                                height={32}
                                                className="rounded-full object-cover flex-shrink-0"
                                              />
                                            ) : (
                                              <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs">
                                                {reply.author.full_name[0]}
                                              </div>
                                            )}
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-gray-900 text-sm">
                                                  {reply.author.full_name}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                  {formatDate(reply.created_at)}
                                                </span>
                                                {reply.is_edited && (
                                                  <span className="text-xs text-gray-400 italic">
                                                    (edited)
                                                  </span>
                                                )}
                                              </div>
                                              {isEditingReply ? (
                                                <div className="mb-2">
                                                  <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    rows={2}
                                                    className="w-full p-2 text-sm border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent mb-2"
                                                  />
                                                  <div className="flex gap-2">
                                                    <button
                                                      onClick={() => handleEditComment(reply.id)}
                                                      className="px-3 py-1 text-xs bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                                                    >
                                                      Save
                                                    </button>
                                                    <button
                                                      onClick={cancelEdit}
                                                      className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                                    >
                                                      Cancel
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <p className="text-gray-700 text-sm mb-2">{reply.content}</p>
                                              )}
                                              <div className="flex items-center gap-3">
                                                {isReplyAuthor && !isEditingReply && (
                                                  <>
                                                    <button 
                                                      onClick={() => startEdit(reply)}
                                                      className="flex items-center gap-1 text-gray-600 hover:text-blue-600 text-xs transition-colors"
                                                    >
                                                      <FaEdit />
                                                      Edit
                                                    </button>
                                                    <button 
                                                      onClick={() => setDeleteCommentId(reply.id)}
                                                      className="flex items-center gap-1 text-gray-600 hover:text-red-600 text-xs transition-colors"
                                                    >
                                                      <FaTrash />
                                                      Delete
                                                    </button>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {/* Reply Form - Shown after replies */}
                            {isReplying && (
                              <div className="mt-4 pl-4 border-l-2 border-pink-200">
                                <form onSubmit={(e) => {
                                  e.preventDefault()
                                  handleSubmitComment(e)
                                }} className="mb-4">
                                  <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Write a reply..."
                                    rows={3}
                                    className="w-full p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent mb-2 transition-all duration-200 focus:scale-[1.01]"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      type="submit"
                                      disabled={submitting || !replyContent.trim()}
                                      className="px-4 py-1 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-all duration-200 hover:scale-105 active:scale-95 transform"
                                    >
                                      {submitting ? 'Posting...' : 'Post Reply'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelReply}
                                      className="px-4 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

