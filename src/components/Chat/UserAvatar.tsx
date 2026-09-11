'use client'

import { useState } from 'react'
import Image from 'next/image'

interface UserAvatarProps {
  avatarUrl?: string | null
  userName?: string | null
  size?: number
  isGuest?: boolean
}

export default function UserAvatar({ avatarUrl, userName = 'User', size = 20, isGuest = false }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false)
  
  // Get first letter of user name for fallback, or "G" for guest
  const initial = isGuest ? 'G' : (userName?.charAt(0).toUpperCase() || 'U')
  
  // If we have a valid avatar URL and no error, show the image
  if (avatarUrl && !imageError && !isGuest) {
    return (
      <div className="h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 shadow-sm flex">
        <Image
          src={avatarUrl}
          alt={userName || 'User Avatar'}
          width={size}
          height={size}
          className="h-full w-full rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    )
  }

  // Fallback: show initial letter (or "G" for guest)
  return (
    <div className={`h-8 w-8 shrink-0 flex items-center justify-center rounded-full border shadow-sm font-semibold text-xs ${
      isGuest
        ? 'border-blue-200 bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600'
        : 'border-pink-200 bg-gradient-to-br from-pink-100 to-rose-100 text-pink-600'
    }`}>
      {initial}
    </div>
  )
}

