'use client'

import Image from 'next/image'
import { ReactNode, useState, useEffect } from 'react'
import motherAndBaby from '@/assets/img/motherandbaby.png'
import auth1 from '@/assets/img/auth-1.png'
import auth2 from '@/assets/img/auth-2.png'
import auth3 from '@/assets/img/auth-3.png'
import logo from '@/assets/img/smallLogo.png'

const authImages = [motherAndBaby, auth1, auth2, auth3]

export default function AuthScreenLayout({ children }: { children: ReactNode }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [fadeClass, setFadeClass] = useState('opacity-100')

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeClass('opacity-0')
      setTimeout(() => {
        setCurrentImageIndex(prev => (prev + 1) % authImages.length)
        setFadeClass('opacity-100')
      }, 500)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <Image
        src={logo}
        alt="Logo"
        width={128}
        height={32}
        className="absolute left-4 top-4 z-10 hidden w-20 rounded-3xl shadow-lg md:block"
      />

      <div className="flex max-h-screen w-full items-center justify-center overflow-y-auto bg-white/50 py-8 backdrop-blur-sm md:w-1/2">
        <div className="w-full max-w-[500px] px-4 md:px-8 xl:px-0">{children}</div>
      </div>

      <div className="relative hidden h-full w-full overflow-hidden md:block md:w-1/2">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-purple-500/10" />
        <div className="relative h-full w-full">
          {authImages.map((image, index) => (
            <Image
              key={index}
              src={image}
              alt={`Authentication ${index + 1}`}
              fill
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
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
