'use client'

import Image from 'next/image'
import Link from 'next/link'
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
    <div className="flex h-dvh min-h-screen w-full overflow-hidden bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white/50 backdrop-blur-sm md:w-1/2 md:flex-none">
        <div className="flex shrink-0 items-center px-4 pb-1 pt-4 sm:px-6 md:px-8">
          <Link href="/" aria-label="Go to MumtaAI homepage" className="inline-flex">
            <Image
              src={logo}
              alt="MumtaAI"
              width={160}
              height={40}
              className="h-11 w-auto sm:h-12"
              priority
            />
          </Link>
        </div>

        <div className="flex min-h-0 flex-1 justify-center overflow-x-hidden overflow-y-auto px-4 pb-8 pt-2 sm:px-6 md:px-8">
          <div className="my-auto w-full min-w-0 max-w-[500px]">{children}</div>
        </div>
      </div>

      <div className="relative hidden min-h-0 min-w-0 overflow-hidden md:block md:w-1/2">
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
