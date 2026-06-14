'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  FaArrowRight,
  FaBluetooth,
  FaCheck,
  FaCheckCircle,
  FaHeart,
  FaLock,
  FaMobileAlt,
  FaShieldAlt,
  FaSignal,
  FaUserFriends,
  FaWaveSquare,
} from 'react-icons/fa'
import LandingNav from '@/components/marketing/LandingNav'
import OximeterLivePreview from '@/components/marketing/oximeter/OximeterLivePreview'
import SiteFooter from '@/components/marketing/SiteFooter'
import { useAuth } from '@/lib/supabase/context'
import heroImage from '@/assets/img/1.png'
import oximeterConnected from '@/assets/img/oximeter connected.png'
import oximeterDisconnected from '@/assets/img/oximeter disconnected.png'

function scrollToHowToConnect() {
  document.getElementById('how-to-connect')?.scrollIntoView({ behavior: 'smooth' })
}

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-4 py-2 bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 rounded-full text-sm font-semibold border border-pink-200">
      {children}
    </span>
  )
}

function OximeterStatusImage({
  src,
  alt,
  className = '',
}: {
  src: typeof oximeterDisconnected
  alt: string
  className?: string
}) {
  return (
    <Image
      src={src}
      alt={alt}
      className={`w-full h-auto block ${className}`}
      sizes="(max-width: 768px) min(100vw, 360px), 340px"
    />
  )
}

const connectSteps = [
  {
    step: 1,
    title: 'Turn On the Oximeter',
    text: 'Insert a finger correctly and turn on the pulse oximeter. Keep the device close to the phone, tablet, or computer.',
    image: oximeterDisconnected,
    imageAlt: 'Oximeter disconnected state',
  },
  {
    step: 2,
    title: 'Open MamtaAI',
    text: 'Sign in to MamtaAI, select the correct baby profile, and open the Oximeter page from the dashboard.',
  },
  {
    step: 3,
    title: 'Start Device Search',
    text: 'Press “Connect Oximeter.” MamtaAI will open the connection window and search for nearby supported Bluetooth devices.',
    hints: ['Searching for nearby devices...', 'Bluetooth must be enabled', 'Keep the oximeter nearby'],
  },
  {
    step: 4,
    title: 'Select the Device',
    text: 'Choose the oximeter from the detected-device list and approve the Bluetooth connection request.',
    example: 'Example: PC-60F_SN804474',
  },
  {
    step: 5,
    title: 'Begin Monitoring',
    text: 'After the connection succeeds, the interface changes to the active state and live measurements begin appearing automatically.',
    image: oximeterConnected,
    imageAlt: 'Oximeter connected state',
    success: true,
  },
]

export default function OximeterIntegrationPage() {
  const { user } = useAuth()
  const connectHref = user ? '/dashboard/oximeter' : '/welcome'

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <LandingNav activePage="oximeter" />

      {/* Hero */}
      <section className="pt-32 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 lg:items-center">
          <div className="space-y-6 animate-fade-in lg:py-2">
            <SectionBadge>MamtaAI Oximeter Integration</SectionBadge>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-gray-900 leading-tight">
              Real-Time Oxygen and Pulse Monitoring,{' '}
              <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">
                Connected to MamtaAI
              </span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Connect a supported Bluetooth pulse oximeter to MamtaAI and view your baby&apos;s oxygen
              saturation, pulse rate, and other available measurements in real time.
            </p>
            <p className="text-base text-gray-600 leading-relaxed">
              MamtaAI turns incoming device readings into a clear monitoring experience, helping parents
              follow live measurements, review session statistics, and keep health records linked to the
              correct baby profile.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href={connectHref}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-8 py-4 text-base font-semibold text-white shadow-lg hover:from-pink-600 hover:to-rose-600 transition-all"
              >
                Connect Your Oximeter
                <FaArrowRight className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <button
                type="button"
                onClick={scrollToHowToConnect}
                className="inline-flex items-center justify-center rounded-xl border-2 border-pink-200 px-8 py-4 text-base font-semibold text-pink-700 hover:bg-pink-50 transition-colors"
              >
                How to Connect
              </button>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end lg:pt-1">
            <div className="relative w-full max-w-[220px] sm:max-w-[240px] lg:max-w-[260px]">
              <div
                className="absolute -inset-3 sm:-inset-4 rounded-2xl bg-gradient-to-br from-pink-300/45 via-rose-300/35 to-purple-300/30 blur-2xl opacity-80 pointer-events-none"
                aria-hidden
              />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-pink-300/25 ring-1 ring-pink-100/70">
                <Image
                  src={heroImage}
                  alt="MamtaAI oximeter integration overview"
                  className="w-full h-auto block"
                  sizes="(max-width: 640px) 220px, 260px"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key measurements */}
      <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Understand the Readings That Matter</h2>
            <p className="mt-4 text-lg text-gray-600">
              MamtaAI presents the measurements received from the connected oximeter in a clear and
              easy-to-read format.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                title: 'Oxygen Saturation — SpO₂',
                text: 'Displays the estimated percentage of oxygen carried in the blood, based on the data received from the connected oximeter.',
                value: '98%',
                color: 'emerald',
              },
              {
                title: 'Pulse Rate',
                text: 'Displays the current pulse rate in beats per minute and updates as new readings are received.',
                value: '72 BPM',
                color: 'rose',
              },
              {
                title: 'Perfusion Index — PI',
                text: 'Shows the available perfusion-strength value when it is provided by the connected device.',
                value: '3.5%',
                color: 'purple',
              },
            ].map(card => (
              <div
                key={card.title}
                className="rounded-3xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/50 p-6 shadow-lg shadow-pink-100/30 hover:shadow-xl transition-shadow"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${
                    card.color === 'emerald'
                      ? 'bg-emerald-100 text-emerald-600'
                      : card.color === 'rose'
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-purple-100 text-purple-600'
                  }`}
                >
                  <FaHeart />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{card.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{card.text}</p>
                <p className="mt-4 text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            Available measurements depend on the connected oximeter model and the data it provides.
          </p>
        </div>
      </section>

      {/* Real-time monitoring */}
      <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              A Clear Real-Time Monitoring Experience
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              After the oximeter is connected, MamtaAI continuously updates the monitoring screen as
              Bluetooth readings arrive.
            </p>
            <ul className="mt-8 space-y-5">
              {[
                {
                  title: 'Instant Updates',
                  text: 'Readings update automatically without manually refreshing the page.',
                },
                {
                  title: 'Session Statistics',
                  text: 'Minimum, maximum, and average values are calculated during each monitoring session.',
                },
                {
                  title: 'Secure History',
                  text: 'Saved sessions can be linked to a baby profile and reviewed later by approved caregivers.',
                },
              ].map(item => (
                <li key={item.title} className="flex gap-3">
                  <FaCheckCircle className="text-pink-500 mt-1 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <OximeterLivePreview />
        </div>
      </section>

      {/* How to connect */}
      <section id="how-to-connect" className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white/70 scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How to Connect Your Oximeter</h2>
            <p className="mt-4 text-lg text-gray-600">
              Follow these steps to pair a compatible Bluetooth oximeter with MamtaAI.
            </p>
          </div>

          <div className="space-y-6">
            {connectSteps.map(item => (
              <div
                key={item.step}
                className="relative rounded-3xl border border-pink-100 bg-white p-6 sm:p-8 shadow-md shadow-pink-100/20"
              >
                <div
                  className={`flex flex-col gap-6 ${item.image ? 'lg:flex-row lg:items-center lg:gap-10' : ''}`}
                >
                  <div className="flex gap-4 flex-1 min-w-0">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white text-lg font-bold shadow-lg shadow-pink-200/50">
                      {item.step}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                      <p className="mt-2 text-gray-600 leading-relaxed">{item.text}</p>

                      {item.hints && (
                        <ul className="mt-4 space-y-2">
                          {item.hints.map(hint => (
                            <li
                              key={hint}
                              className="flex items-center gap-2 text-sm text-gray-700 rounded-xl bg-pink-50/80 border border-pink-100 px-3 py-2"
                            >
                              <FaBluetooth className="text-pink-500 shrink-0" />
                              {hint}
                            </li>
                          ))}
                        </ul>
                      )}

                      {item.example && (
                        <p className="mt-3 text-sm font-mono text-pink-700 bg-pink-50 inline-block px-3 py-1.5 rounded-lg border border-pink-100">
                          {item.example}
                        </p>
                      )}

                      {item.success && (
                        <p className="mt-4 text-sm text-emerald-800 leading-relaxed">
                          The device is active and ready to send readings.
                        </p>
                      )}
                    </div>
                  </div>

                  {item.image && (
                    <div className="w-full max-w-[300px] sm:max-w-[320px] mx-auto lg:mx-0 lg:w-[300px] xl:w-[340px] shrink-0">
                      <OximeterStatusImage src={item.image} alt={item.imageAlt ?? ''} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connection status comparison */}
      <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            Know Your Connection Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-lg">
              <div className="mx-auto mb-6 w-full max-w-[320px]">
                <OximeterStatusImage src={oximeterDisconnected} alt="Disconnected oximeter" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center">Disconnected</h3>
              <p className="mt-3 text-gray-600 text-center text-sm leading-relaxed">
                No oximeter is currently connected. Turn on your device and press “Connect Oximeter” to
                begin searching.
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  href={connectHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white hover:from-pink-600 hover:to-rose-600 transition-all"
                >
                  Connect Oximeter
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40 p-6 sm:p-8 shadow-lg">
              <div className="mx-auto mb-6 w-full max-w-[320px]">
                <OximeterStatusImage src={oximeterConnected} alt="Connected oximeter" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center">Connected</h3>
              <p className="mt-3 text-gray-600 text-center text-sm leading-relaxed">
                The oximeter is connected and MamtaAI is receiving live measurements.
              </p>
              <ul className="mt-5 space-y-2 max-w-xs mx-auto">
                {['Device active', 'Bluetooth connected', 'Live data available'].map(label => (
                  <li
                    key={label}
                    className="flex items-center gap-2 text-sm font-medium text-emerald-800 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100"
                  >
                    <FaCheck className="text-emerald-600 shrink-0" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What happens after connection */}
      <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-50/80 to-purple-50/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center">
            What Happens After Connection?
          </h2>

          <div className="mt-10 flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-gray-700">
            {[
              'Oximeter',
              'Bluetooth Connection',
              'MamtaAI Interface',
              'Session Statistics',
              'Secure Health History',
            ].map((label, i, arr) => (
              <span key={label} className="flex items-center gap-2">
                <span className="rounded-full bg-white border border-pink-200 px-3 py-1.5 shadow-sm">{label}</span>
                {i < arr.length - 1 && <FaArrowRight className="text-pink-400 hidden sm:inline" />}
              </span>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FaHeart,
                title: 'Device Reading',
                text: 'The oximeter measures and broadcasts the available pulse and oxygen data.',
              },
              {
                icon: FaBluetooth,
                title: 'Bluetooth Transfer',
                text: 'MamtaAI receives supported device packets through a Bluetooth Low Energy connection.',
              },
              {
                icon: FaSignal,
                title: 'Live Display',
                text: 'Parsed readings update the user interface immediately without requiring a page refresh.',
              },
              {
                icon: FaLock,
                title: 'Session Storage',
                text: 'Valid readings may be stored securely and linked to the selected baby and monitoring session.',
              },
              {
                icon: FaUserFriends,
                title: 'Family Review',
                text: 'Approved parents or caregivers can review saved sessions according to their access permissions.',
              },
            ].map(item => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-pink-100 bg-white p-5 shadow-md shadow-pink-100/20"
                >
                  <Icon className="text-pink-500 text-xl mb-3" />
                  <h3 className="font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Compatibility */}
      <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white/60">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            Device and Browser Compatibility
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: FaBluetooth,
                title: 'Bluetooth Requirement',
                text: 'The oximeter must support Bluetooth Low Energy and expose data that MamtaAI can interpret.',
              },
              {
                icon: FaWaveSquare,
                title: 'Browser Support',
                text: 'Web Bluetooth availability differs between browsers and operating systems. Chrome-based browsers generally provide the strongest support on compatible desktop and Android devices.',
              },
              {
                icon: FaMobileAlt,
                title: 'iPhone and iPad',
                text: 'Direct browser-based Bluetooth support may be limited on iOS.',
              },
              {
                icon: FaShieldAlt,
                title: 'Device Protocol',
                text: 'Some oximeters use proprietary packet formats. A device must be tested and supported before its readings can be presented reliably.',
              },
            ].map(item => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/40 p-5"
                >
                  <Icon className="text-rose-500 mb-3" />
                  <h3 className="font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto rounded-3xl border border-pink-100 bg-white p-8 sm:p-10 shadow-xl shadow-pink-100/30">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
            Designed with Privacy and Responsible Use in Mind
          </h2>
          <p className="mt-4 text-gray-600 text-center leading-relaxed">
            Oximeter sessions are connected to authenticated users and selected baby profiles. Access to
            stored readings should follow MamtaAI&apos;s family and caregiver permission rules.
          </p>
          <div className="mt-8 rounded-2xl border border-pink-200/80 bg-gradient-to-br from-pink-50 to-rose-50/90 p-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold text-pink-800">Important: </span>
              MamtaAI is not a medical device and does not provide a diagnosis. Oximeter readings may be
              affected by movement, positioning, circulation, device quality, and other factors. Contact a
              qualified medical professional if you are concerned about a baby&apos;s health or measurements.
            </p>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={connectHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-8 py-3.5 text-base font-semibold text-white hover:from-pink-600 hover:to-rose-600 transition-all"
            >
              Connect Your Oximeter
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-pink-200 px-8 py-3.5 text-base font-semibold text-pink-700 hover:bg-pink-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
