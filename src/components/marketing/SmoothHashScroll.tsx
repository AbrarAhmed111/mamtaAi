'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, '')
  if (!id) return
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export default function SmoothHashScroll() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (!hash) return
    const timer = window.setTimeout(() => scrollToHash(hash), 120)
    return () => window.clearTimeout(timer)
  }, [pathname])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a[href*="#"]') as HTMLAnchorElement | null
      if (!anchor) return

      let url: URL
      try {
        url = new URL(anchor.href, window.location.href)
      } catch {
        return
      }

      if (!url.hash || url.hash === '#') return

      const sameDocument =
        url.pathname === window.location.pathname ||
        (url.pathname === '/' && window.location.pathname === '/')

      if (!sameDocument) return

      // Cross-route to home with hash: let Next.js navigate, pathname effect will scroll
      if (url.pathname === '/' && window.location.pathname !== '/') return

      event.preventDefault()
      const nextUrl = `${url.pathname}${url.search}${url.hash}`
      window.history.pushState(null, '', nextUrl)
      scrollToHash(url.hash)
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return null
}
