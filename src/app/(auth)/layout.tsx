'use client'

import Image from 'next/image'
import { ReactNode } from 'react'
import authImage from '@/assets/img/motherandbaby.jpg'
import logo from '@/assets/img/smallLogo.png'


type AuthLayoutProps = {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex w-full h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      {/* Logo */}
      <Image
        src={logo}
        alt="Logo"
        width={128}
        height={32}
        className="w-20 absolute rounded-3xl top-4 left-4 hidden md:block z-10 shadow-lg"
      />

      {/* Left side - Content */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white/50 backdrop-blur-sm">
        <div className="w-full max-w-[500px] px-4 md:px-8 xl:px-0">
          {children}
        </div>
      </div>

      {/* Right side - Image */}
      <div className="w-full md:w-1/2 h-full hidden md:block relative">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-purple-500/10 z-10"></div>
        <Image
          src={authImage}
          alt="Authentication"
          width={1000}
          height={1000}
          className="w-full h-full object-cover"
          priority
        />
      </div>
    </div>
  )
}
