'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FaArrowRight, FaChartBar, FaHeartbeat, FaUsers } from 'react-icons/fa'
import oximeterPromo from '@/assets/img/2.png'

const features = [
  {
    icon: FaHeartbeat,
    title: 'Live Readings',
    text: 'View oxygen saturation and pulse-rate changes as they are received from the connected device.',
    iconClass: 'bg-rose-100 text-rose-600',
  },
  {
    icon: FaChartBar,
    title: 'Session Insights',
    text: 'See minimum, maximum, and average readings from each monitoring session.',
    iconClass: 'bg-purple-100 text-purple-600',
  },
  {
    icon: FaUsers,
    title: 'Family Access',
    text: 'Allow approved family members or caregivers to review saved health readings securely.',
    iconClass: 'bg-pink-100 text-pink-600',
  },
]

export default function OximeterLandingSection() {
  return (
    <section
      id="oximeter"
      className="relative py-20 lg:py-24 overflow-hidden bg-gradient-to-br from-white via-pink-50/80 to-rose-50/60"
    >
      <div className="absolute top-0 right-0 w-72 h-72 bg-pink-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-200/25 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in">
        {/* Badge + heading + description */}
        <span className="inline-block px-4 py-2 bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 rounded-full text-sm font-semibold border border-pink-200">
          Smart Health Monitoring
        </span>

        <h2 className="mt-6 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight max-w-4xl mx-auto">
          Connect an{' '}
          <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">
            Oximeter
          </span>{' '}
          and Monitor Your Baby&apos;s Vitals in Real Time
        </h2>

        <p className="mt-5 text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
          MamtaAI connects with compatible Bluetooth pulse oximeters to display live oxygen saturation,
          pulse rate, and perfusion index readings. Parents can monitor important health signals from one
          simple and secure dashboard.
        </p>

        {/* Image — after description */}
        <div className="relative mt-10 mx-auto w-full max-w-4xl">
          <div
            className="absolute -inset-4 sm:-inset-6 rounded-[2rem] bg-gradient-to-br from-pink-300/45 via-rose-300/35 to-purple-300/30 blur-2xl opacity-80 pointer-events-none"
            aria-hidden
          />
          <div className="relative rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden shadow-2xl shadow-pink-300/25 ring-1 ring-pink-100/70">
            <Image
              src={oximeterPromo}
              alt="MamtaAI dashboard connected to a Bluetooth pulse oximeter"
              className="w-full h-auto block"
              sizes="(max-width: 1024px) 100vw, 896px"
              priority={false}
            />
          </div>
        </div>

        {/* Feature points — row */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-left">
          {features.map(item => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-pink-100/80 bg-white/80 p-5 shadow-sm shadow-pink-100/30"
              >
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${item.iconClass}`}
                >
                  <Icon className="text-lg" />
                </span>
                <p className="mt-3 font-semibold text-gray-900">{item.title}</p>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.text}</p>
              </div>
            )
          })}
        </div>

        {/* Buttons — row */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/oximeter"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-pink-200/50 hover:from-pink-600 hover:to-rose-600 hover:shadow-xl transition-all duration-300"
          >
            Explore Oximeter Integration
            <FaArrowRight className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/oximeter#how-to-connect"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border-2 border-pink-200 px-8 py-4 text-base font-semibold text-pink-700 hover:bg-pink-50 transition-colors duration-300"
          >
            Learn How It Connects
          </Link>
        </div>

        {/* Compatibility note */}
        <p className="mt-6 text-xs text-gray-500 max-w-2xl mx-auto">
          Bluetooth Low Energy connection. Device compatibility may vary by browser and operating system.
        </p>
      </div>
    </section>
  )
}
