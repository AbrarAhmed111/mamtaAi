'use client'

import Image from 'next/image'
import { FaUserMd, FaStar } from 'react-icons/fa'
import {
  type CommunityAuthorProfile,
  getProfessionalTitle,
  isExpertAuthor,
  isNewExpertProfile,
} from '@/lib/expert/community-author'

export function ExpertAuthorBadges({ author }: { author: CommunityAuthorProfile }) {
  if (!isExpertAuthor(author)) return null

  return (
    <>
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
        <FaUserMd className="text-[10px]" aria-hidden />
        Expert
      </span>
      {isNewExpertProfile(author) ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
          <FaStar className="text-[10px]" aria-hidden />
          Newbie
        </span>
      ) : null}
    </>
  )
}

export function ExpertContentBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700 ${className}`}
    >
      <FaUserMd className="text-[10px]" aria-hidden />
      Expert
    </span>
  )
}

type CommunityAuthorIdentityProps = {
  author: CommunityAuthorProfile
  avatarSize?: number
  nameSize?: 'sm' | 'md'
  subtitle?: string | null
  showSubtitle?: boolean
}

export default function CommunityAuthorIdentity({
  author,
  avatarSize = 40,
  nameSize = 'md',
  subtitle,
  showSubtitle = true,
}: CommunityAuthorIdentityProps) {
  const isExpert = isExpertAuthor(author)
  const proTitle = subtitle ?? getProfessionalTitle(author)
  const nameCls = nameSize === 'sm' ? 'text-sm' : 'text-base'
  const iconSize = avatarSize <= 32 ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const iconInner = avatarSize <= 32 ? 'text-[7px]' : 'text-[8px]'

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="relative shrink-0">
        {author.avatar_url ? (
          <Image
            src={author.avatar_url}
            alt={author.full_name}
            width={avatarSize}
            height={avatarSize}
            className="rounded-full object-cover"
            style={{ width: avatarSize, height: avatarSize }}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-full bg-pink-200 font-semibold text-gray-700"
            style={{ width: avatarSize, height: avatarSize, fontSize: avatarSize <= 32 ? '0.75rem' : '0.875rem' }}
          >
            {author.full_name[0]}
          </div>
        )}
        {isExpert ? (
          <span
            className={`absolute -bottom-0.5 -right-0.5 flex ${iconSize} items-center justify-center rounded-full bg-purple-600 text-white ring-2 ring-white`}
            title="Verified expert"
          >
            <FaUserMd className={iconInner} aria-hidden />
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-semibold text-gray-900 ${nameCls}`}>{author.full_name}</span>
          <ExpertAuthorBadges author={author} />
        </div>
        {showSubtitle && proTitle ? (
          <div className="truncate text-xs text-gray-500">{proTitle}</div>
        ) : null}
      </div>
    </div>
  )
}
