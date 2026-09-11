'use client'

import { useState } from 'react'
import { FaFlag } from 'react-icons/fa'
import { toast } from '@/components/ui/sonner'

type ContentType = 'blog_post' | 'forum_thread' | 'forum_reply' | 'blog_comment'

export default function ReportContentButton({
  contentType,
  contentId,
  className = '',
}: {
  contentType: ContentType
  contentId: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/community/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          contentId,
          reason: reason.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to submit report')
      toast.success('Report submitted. Our team will review it.')
      setOpen(false)
      setReason('')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 ${className}`}
      >
        <FaFlag className="text-[10px]" />
        Report
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Report content</h3>
            <p className="mt-2 text-sm text-gray-600">
              Tell us why this content should be reviewed. Admins are notified immediately.
            </p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Optional reason (spam, harassment, misinformation…)"
              className="mt-4 w-full rounded-xl border border-pink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submit()}
                className="rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
