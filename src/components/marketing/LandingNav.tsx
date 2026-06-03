'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { FaBars, FaTimes } from 'react-icons/fa'
import logo from '@/assets/img/smallLogo.png'
import { Skeleton } from '@/components/ui/skeleton'
import type { AuthUser } from '@/lib/supabase/actions'
import { useAuth } from '@/lib/supabase/context'

type ActivePage = 'home' | 'pricing'

type LandingNavProps = {
  activePage?: ActivePage
}

function hashHref(hash: string, activePage?: ActivePage) {
  return activePage === 'pricing' ? `/${hash}` : hash
}

function navLinkClass(isActive: boolean, isHomeActive?: boolean) {
  const color = isActive
    ? isHomeActive
      ? 'text-gray-900'
      : 'text-pink-600'
    : 'text-gray-600 hover:text-pink-600'
  return `relative px-4 py-2 text-sm font-medium ${color} transition-colors duration-200 group`
}

function mobileLinkClass(isActive: boolean) {
  return isActive
    ? 'block px-3 py-3 text-base font-medium text-pink-600 bg-pink-50 rounded-lg transition-colors duration-200'
    : 'block px-3 py-3 text-base font-medium text-gray-600 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors duration-200'
}

function DesktopAuthSkeleton() {
  return (
    <div
      className="flex items-center space-x-4"
      aria-hidden="true"
    >
      <Skeleton className="h-9 w-[4.5rem] rounded-lg" />
      <Skeleton className="h-10 w-[7.25rem] rounded-lg" />
    </div>
  )
}

function MobileAuthSkeleton() {
  return (
    <div className="space-y-2 pt-1" aria-hidden="true">
      <Skeleton className="h-11 w-full rounded-lg" />
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  )
}

function DesktopAuthActions({ user }: { user: AuthUser | null }) {
  if (user) {
    return (
      <Link
        href="/dashboard"
        className="relative bg-gradient-to-r from-pink-500 to-rose-500 !text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        Dashboard
      </Link>
    )
  }
  return (
    <>
      <Link
        href="/welcome"
        className="text-gray-600 hover:text-pink-600 px-4 py-2 text-sm font-medium transition-colors duration-200"
      >
        Sign In
      </Link>
      <Link
        href="/welcome"
        className="relative bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        Get Started
      </Link>
    </>
  )
}

function MobileAuthActions({
  user,
  onNavigate,
}: {
  user: AuthUser | null
  onNavigate: () => void
}) {
  if (user) {
    return (
      <Link
        href="/dashboard"
        className="block px-3 py-3 text-base font-medium bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300"
        onClick={onNavigate}
      >
        Dashboard
      </Link>
    )
  }
  return (
    <>
      <Link
        href="/welcome"
        className="block px-3 py-3 text-base font-medium text-gray-600 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors duration-200"
        onClick={onNavigate}
      >
        Sign In
      </Link>
      <Link
        href="/welcome"
        className="block px-3 py-3 text-base font-medium bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300"
        onClick={onNavigate}
      >
        Get Started
      </Link>
    </>
  )
}

export default function LandingNav({ activePage = 'home' }: LandingNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, loading } = useAuth()

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-lg z-50 border-b border-pink-100/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center group cursor-pointer" onClick={closeMenu}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300" />
              <div className="relative">
                <Image
                  src={logo}
                  alt="MamtaAI"
                  className="h-16 rounded-full w-16 text-blue-600 group-hover:text-purple-600 transition-colors duration-300"
                />
              </div>
            </div>
            <div className="ml-3">
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">
                MamtaAI
              </span>
              <div className="text-xs text-gray-500 font-medium">AI-Powered Baby Care</div>
            </div>
          </Link>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              <a
                href={hashHref('#home', activePage)}
                className={navLinkClass(activePage === 'home', activePage === 'home')}
              >
                Home
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-300 ${
                    activePage === 'home' ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </a>
              <a href={hashHref('#features', activePage)} className={navLinkClass(false)}>
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 group-hover:w-full transition-all duration-300" />
              </a>
              <Link href="/pricing" className={navLinkClass(activePage === 'pricing')}>
                Pricing
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-300 ${
                    activePage === 'pricing' ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
              <a href={hashHref('#faq', activePage)} className={navLinkClass(false)}>
                FAQ
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 group-hover:w-full transition-all duration-300" />
              </a>
              <a href={hashHref('#testimonials', activePage)} className={navLinkClass(false)}>
                Testimonials
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 group-hover:w-full transition-all duration-300" />
              </a>
              <a href={hashHref('#contact', activePage)} className={navLinkClass(false)}>
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 group-hover:w-full transition-all duration-300" />
              </a>
            </div>
          </div>

          <div
            className="hidden md:flex items-center space-x-4 min-h-[2.5rem]"
            aria-busy={loading}
            aria-live="polite"
          >
            {loading ? (
              <>
                <span className="sr-only">Checking sign-in status</span>
                <DesktopAuthSkeleton />
              </>
            ) : (
              <DesktopAuthActions user={user} />
            )}
          </div>

          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-200/50 shadow-lg animate-fade-in">
          <div className="px-4 pt-2 pb-3 space-y-1">
            <a
              href={hashHref('#home', activePage)}
              className={mobileLinkClass(activePage === 'home')}
              onClick={closeMenu}
            >
              Home
            </a>
            <a
              href={hashHref('#features', activePage)}
              className={mobileLinkClass(false)}
              onClick={closeMenu}
            >
              Features
            </a>
            <Link href="/pricing" className={mobileLinkClass(activePage === 'pricing')} onClick={closeMenu}>
              Pricing
            </Link>
            <a href={hashHref('#faq', activePage)} className={mobileLinkClass(false)} onClick={closeMenu}>
              FAQ
            </a>
            <a
              href={hashHref('#testimonials', activePage)}
              className={mobileLinkClass(false)}
              onClick={closeMenu}
            >
              Testimonials
            </a>
            <a href={hashHref('#contact', activePage)} className={mobileLinkClass(false)} onClick={closeMenu}>
              Contact
            </a>
            <div className="pt-4 border-t border-gray-200" aria-busy={loading}>
              {loading ? (
                <>
                  <span className="sr-only">Checking sign-in status</span>
                  <MobileAuthSkeleton />
                </>
              ) : (
                <MobileAuthActions user={user} onNavigate={closeMenu} />
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
