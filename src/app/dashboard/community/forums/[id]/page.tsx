'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FaHeart, FaReply, FaEye, FaArrowLeft, FaLock, FaCheckCircle, FaThumbtack } from 'react-icons/fa'
import Image from 'next/image'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface ForumThread {
  id: string
  title: string
  content: string
  view_count: number | null
  reply_count: number | null
  like_count: number | null
  is_pinned: boolean | null
  is_locked: boolean | null
  is_solved: boolean | null
  tags: string[] | null
  created_at: string | null
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

interface Reply {
  id: string
  content: string
  like_count: number | null
  is_accepted_answer: boolean | null
  created_at: string | null
  author: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
  parent_reply_id: string | null
}

export default function ForumThreadPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [thread, setThread] = useState<ForumThread | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadThread()
    loadReplies()
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

  const loadThread = async () => {
    try {
      const res = await fetch(`/api/community/forum/threads/${id}`)
      const data = await res.json()
      if (data.thread) {
        setThread(data.thread)
      } else {
        toast.error('Thread not found')
        router.push('/dashboard/community')
      }
    } catch (error) {
      toast.error('Failed to load thread')
      router.push('/dashboard/community')
    } finally {
      setLoading(false)
    }
  }

  const loadReplies = async () => {
    try {
      const res = await fetch(`/api/community/forum/threads/${id}/replies`)
      const data = await res.json()
      setReplies(data.replies || [])
    } catch (error) {
      console.error('Failed to load replies')
    }
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/community/forum/threads/${id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      })

      if (res.ok) {
        setReplyContent('')
        toast.success('Reply posted!')
        loadReplies()
        loadThread() // Refresh to update reply count
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to post reply')
      }
    } catch (error) {
      toast.error('Failed to post reply')
    } finally {
      setSubmitting(false)
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

  if (!thread) {
    return null
  }

  const canReply = !thread.is_locked && user

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/dashboard/community"
          className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 mb-6"
        >
          <FaArrowLeft />
          Back to Forums
        </Link>

        {/* Thread Content */}
        <article className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              {thread.is_pinned && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-semibold rounded flex items-center gap-1">
                  <FaThumbtack /> Pinned
                </span>
              )}
              {thread.is_solved && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded flex items-center gap-1">
                  <FaCheckCircle /> Solved
                </span>
              )}
              {thread.is_locked && (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded flex items-center gap-1">
                  <FaLock /> Locked
                </span>
              )}
              {thread.category && (
                <span
                  className="px-3 py-1 text-white text-sm font-semibold rounded"
                  style={{ backgroundColor: thread.category.color_hex || '#ec4899' }}
                >
                  {thread.category.name}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {thread.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
              {thread.author && (
                <div className="flex items-center gap-2">
                  {thread.author.avatar_url ? (
                    <Image
                      src={thread.author.avatar_url}
                      alt={thread.author.full_name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover h-10 w-10"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center">
                      {thread.author.full_name[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">{thread.author.full_name}</div>
                    <div className="text-xs text-gray-500">{formatDate(thread.created_at)}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="prose max-w-none mb-6">
              <div
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: thread.content.replace(/\n/g, '<br />') }}
              />
            </div>

            {thread.tags && thread.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {thread.tags.map((tag, idx) => (
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
                <span>{thread.like_count || 0}</span>
              </button>
              <div className="flex items-center gap-2 text-gray-600">
                <FaReply />
                <span>{thread.reply_count || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FaEye />
                <span>{thread.view_count || 0}</span>
              </div>
            </div>
          </div>
        </article>

        {/* Replies Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Replies ({replies.length})
          </h2>

          {/* Reply Form */}
          {canReply ? (
            <form onSubmit={handleSubmitReply} className="mb-8">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={4}
                className="w-full p-4 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent mb-4"
              />
              <button
                type="submit"
                disabled={submitting || !replyContent.trim()}
                className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 transition-all"
              >
                {submitting ? 'Posting...' : 'Post Reply'}
              </button>
            </form>
          ) : thread.is_locked ? (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              This thread is locked and no longer accepting replies.
            </div>
          ) : (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
              Please sign in to reply to this thread.
            </div>
          )}

          {/* Replies List */}
          <div className="space-y-6">
            {replies.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No replies yet. Be the first to reply!</p>
            ) : (
              replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`border-l-4 pl-6 pb-6 ${
                    reply.is_accepted_answer
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {reply.author && (
                      <>
                        {reply.author.avatar_url ? (
                          <Image
                            src={reply.author.avatar_url}
                            alt={reply.author.full_name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0">
                            {reply.author.full_name[0]}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">
                              {reply.author.full_name}
                            </span>
                            {reply.is_accepted_answer && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded flex items-center gap-1">
                                <FaCheckCircle /> Accepted Answer
                              </span>
                            )}
                            <span className="text-sm text-gray-500">
                              {formatDate(reply.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{reply.content}</p>
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-1 text-gray-600 hover:text-pink-600 text-sm">
                              <FaHeart />
                              <span>{reply.like_count || 0}</span>
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

