'use client'

import React from 'react'

export function Tooltip({
  content,
  children,
}: {
  content: string
  children: React.ReactNode
}) {
  // Minimal tooltip via title attribute (can replace with Radix Tooltip later)
  return <span title={content}>{children}</span>
}


