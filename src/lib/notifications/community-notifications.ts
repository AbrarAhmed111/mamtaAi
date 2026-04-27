import { supabaseAdmin } from '@/lib/supabase/client'
import { parseNotificationPreferences } from '@/lib/notification-preferences'

/** Match @<uuid> in text (for explicit mentions; avoids ambiguous @name lookups). */
const MENTION_UUID_RE = /@([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/gi

export function extractMentionUserIdsFromText(text: string, excludeUserId: string): string[] {
  const exclude = excludeUserId.toLowerCase()
  const found = new Set<string>()
  const s = String(text || '')
  let m: RegExpExecArray | null
  MENTION_UUID_RE.lastIndex = 0
  while ((m = MENTION_UUID_RE.exec(s)) !== null) {
    const id = m[1].toLowerCase()
    if (id && id !== exclude) found.add(id)
  }
  return [...found]
}

async function communityNotificationsEnabled(userId: string): Promise<boolean> {
  try {
    const { data } = await (supabaseAdmin as any).from('profiles').select('metadata').eq('id', userId).maybeSingle()
    return parseNotificationPreferences(data?.metadata).community !== false
  } catch {
    return true
  }
}

async function resolveProfileIds(ids: string[]): Promise<string[]> {
  const unique = [...new Set(ids.map(id => String(id).trim()).filter(Boolean))]
  if (!unique.length) return []
  const { data } = await (supabaseAdmin as any).from('profiles').select('id').in('id', unique)
  return (data || []).map((r: { id: string }) => r.id)
}

async function insertCommunityNotification(args: {
  userId: string
  title: string
  body: string
  category: 'forum' | 'blog'
  actionUrl: string
  actionData: Record<string, unknown>
}) {
  if (!(await communityNotificationsEnabled(args.userId))) return
  try {
    await (supabaseAdmin as any).from('notifications').insert({
      user_id: args.userId,
      title: args.title,
      body: args.body,
      notification_type: 'system',
      category: args.category,
      priority: 'normal',
      action_type: 'community',
      action_url: args.actionUrl,
      action_data: args.actionData,
    } as any)
  } catch {
    // Non-fatal: reply/comment still succeeded
  }
}

function truncateTitle(title: string, max = 56): string {
  const t = title.trim()
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`
}

/** Fire-and-forget: forum reply → thread author, parent reply author, @uuid mentions. */
export function notifyForumReplyCommunityNotifications(params: {
  threadId: string
  threadTitle: string
  threadAuthorId: string
  replierId: string
  replierName: string
  replyId: string
  content: string
  parentReplyId: string | null
  parentAuthorId: string | null
}): void {
  void (async () => {
    const {
      threadId,
      threadTitle,
      threadAuthorId,
      replierId,
      replierName,
      replyId,
      content,
      parentReplyId,
      parentAuthorId,
    } = params

    const shortTitle = truncateTitle(threadTitle)
    const url = `/dashboard/community/forums/${threadId}`

    const mentionUserIds = await resolveProfileIds(extractMentionUserIdsFromText(content, replierId))
    const mentionSet = new Set(mentionUserIds)

    for (const uid of mentionSet) {
      await insertCommunityNotification({
        userId: uid,
        title: 'You were mentioned in the forum',
        body: `${replierName} mentioned you in “${shortTitle}”.`,
        category: 'forum',
        actionUrl: url,
        actionData: { threadId, replyId, kind: 'mention' },
      })
    }

    const replyRecipients = new Set<string>()
    if (threadAuthorId && threadAuthorId !== replierId) replyRecipients.add(threadAuthorId)
    if (parentReplyId && parentAuthorId && parentAuthorId !== replierId) replyRecipients.add(parentAuthorId)

    for (const uid of replyRecipients) {
      if (mentionSet.has(uid)) continue
      const isParent = Boolean(parentReplyId && parentAuthorId === uid)
      await insertCommunityNotification({
        userId: uid,
        title: isParent ? 'New reply to your forum message' : 'New reply in your forum thread',
        body: isParent
          ? `${replierName} replied to you in “${shortTitle}”.`
          : `${replierName} replied in “${shortTitle}”.`,
        category: 'forum',
        actionUrl: url,
        actionData: { threadId, replyId, kind: isParent ? 'reply_parent' : 'reply_thread' },
      })
    }
  })()
}

/** Fire-and-forget: blog comment → post author, parent comment author, @uuid mentions. */
export function notifyBlogCommentCommunityNotifications(params: {
  postId: string
  postTitle: string
  postAuthorId: string
  commenterId: string
  commenterName: string
  commentId: string
  content: string
  parentCommentId: string | null
  parentAuthorId: string | null
}): void {
  void (async () => {
    const {
      postId,
      postTitle,
      postAuthorId,
      commenterId,
      commenterName,
      commentId,
      content,
      parentCommentId,
      parentAuthorId,
    } = params

    const shortTitle = truncateTitle(postTitle)
    const url = `/dashboard/community/blog/${postId}`

    const mentionUserIds = await resolveProfileIds(extractMentionUserIdsFromText(content, commenterId))
    const mentionSet = new Set(mentionUserIds)

    for (const uid of mentionUserIds) {
      await insertCommunityNotification({
        userId: uid,
        title: 'You were mentioned on a blog post',
        body: `${commenterName} mentioned you on “${shortTitle}”.`,
        category: 'blog',
        actionUrl: url,
        actionData: { postId, commentId, kind: 'mention' },
      })
    }

    const replyRecipients = new Set<string>()
    if (postAuthorId && postAuthorId !== commenterId) replyRecipients.add(postAuthorId)
    if (parentCommentId && parentAuthorId && parentAuthorId !== commenterId) replyRecipients.add(parentAuthorId)

    for (const uid of replyRecipients) {
      if (mentionSet.has(uid)) continue
      const isParent = Boolean(parentCommentId && parentAuthorId === uid)
      await insertCommunityNotification({
        userId: uid,
        title: isParent ? 'New reply to your blog comment' : 'New comment on your blog post',
        body: isParent
          ? `${commenterName} replied to you on “${shortTitle}”.`
          : `${commenterName} commented on “${shortTitle}”.`,
        category: 'blog',
        actionUrl: url,
        actionData: { postId, commentId, kind: isParent ? 'reply_parent' : 'comment_post' },
      })
    }
  })()
}
