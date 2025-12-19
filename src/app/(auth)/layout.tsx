'use client'

import Image from 'next/image'
import { ReactNode, useState, useEffect } from 'react'
import motherAndBaby from '@/assets/img/motherandbaby.png'
import auth1 from '@/assets/img/auth-1.png'
import auth2 from '@/assets/img/auth-2.png'
import auth3 from '@/assets/img/auth-3.png'
import logo from '@/assets/img/smallLogo.png'

type AuthLayoutProps = {
  children: ReactNode
}

const authImages = [
  motherAndBaby,
  auth1,
  auth2,
  auth3,
]

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [fadeClass, setFadeClass] = useState('opacity-100')

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setFadeClass('opacity-0')
      
      // Change image after fade out
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % authImages.length)
        setFadeClass('opacity-100')
      }, 500) // Half of transition duration
    }, 4000) // Change image every 4 seconds

    return () => clearInterval(interval)
  }, [])

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

      {/* Right side - Image Carousel */}
      <div className="w-full md:w-1/2 h-full hidden md:block relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-purple-500/10 z-10"></div>
        <div className="relative w-full h-full">
          {authImages.map((image, index) => (
            <Image
              key={index}
              src={image}
              alt={`Authentication ${index + 1}`}
              fill
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                index === currentImageIndex ? fadeClass : 'opacity-0'
              }`}
              priority={index === 0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
