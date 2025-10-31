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
    <div className="flex w-full h-screen">
      {/* Logo */}
      <Image
        src={logo}
        alt="Logo"
        width={128}
        height={32}
        className="w-20 absolute rounded-3xl top-4 left-4 hidden md:block z-10"
      />

      {/* Left side - Content */}
      <div className="w-full md:w-1/2 flex items-center justify-center">
        <div className="w-full max-w-[500px] px-4 md:px-8 xl:px-0">
          {children}
        </div>
      </div>

      {/* Right side - Image */}
      <div className="w-full md:w-1/2 h-full hidden md:block">
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
