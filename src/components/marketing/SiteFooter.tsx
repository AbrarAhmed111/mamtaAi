'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  FaArrowRight,
  FaEnvelope,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaMapMarkerAlt,
  FaPhone,
  FaStar,
  FaTwitter,
} from 'react-icons/fa'
import smallLogo from '@/assets/img/smallLogo.png'

export default function SiteFooter() {
  const year = new Date().getFullYear()

  const linkClass =
    'text-pink-200/90 hover:text-white transition-colors duration-200 flex items-center group'

  return (
    <footer
      id="contact"
      className="relative bg-gradient-to-br from-gray-900 via-rose-950 to-purple-950 text-white overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500/10 to-purple-500/10" />
        <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
       

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="flex items-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full blur opacity-75" />
                  <div className="relative">
                    <Image src={smallLogo} alt="MamtaAI" className="h-12 w-12 rounded-full" />
                  </div>
                </div>
                <div className="ml-3">
                  <span className="text-2xl font-bold bg-gradient-to-r from-pink-300 to-rose-200 bg-clip-text text-transparent">
                    MamtaAI
                  </span>
                  <div className="text-xs text-pink-200/80 font-medium">AI-Powered Baby Care</div>
                </div>
              </div>
              <p className="text-pink-100/80 mb-6 leading-relaxed text-sm">
                Revolutionary AI-powered baby cry translation system helping parents understand their
                baby&apos;s needs with precision and care.
              </p>
              <div className="flex space-x-3">
                {[FaFacebook, FaTwitter, FaInstagram, FaLinkedin].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-pink-500 hover:scale-105 transition-all duration-300 group"
                    aria-label="Social link"
                  >
                    <Icon className="h-5 w-5 text-pink-100/70 group-hover:text-white" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Product</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/#features" className={linkClass}>
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/#faq" className={linkClass}>
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/oximeter" className={linkClass}>
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Oximeter
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className={linkClass}>
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Support</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="mailto:support@mamtaai.com" className={linkClass}>
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Contact Support
                  </a>
                </li>
                <li>
                  <Link href="/privacy" className={linkClass}>
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className={linkClass}>
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Get in Touch</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center group">
                  <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center mr-3 group-hover:bg-pink-500/30 transition-colors">
                    <FaEnvelope className="h-4 w-4 text-pink-300" />
                  </div>
                  <div>
                    <p className="text-pink-200/80 text-xs">Email us</p>
                    <p className="text-white font-medium">support@mamtaai.com</p>
                  </div>
                </div>
                <div className="flex items-center group">
                  <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center mr-3 group-hover:bg-rose-500/30 transition-colors">
                    <FaPhone className="h-4 w-4 text-rose-300" />
                  </div>
                  <div>
                    <p className="text-pink-200/80 text-xs">Call us</p>
                    <p className="text-white font-medium">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center group">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mr-3 group-hover:bg-purple-500/30 transition-colors">
                    <FaMapMarkerAlt className="h-4 w-4 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-pink-200/80 text-xs">Visit us</p>
                    <p className="text-white font-medium">Islamabad, Pakistan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-pink-200/80 text-sm text-center md:text-left">
                © {year} MamtaAI. All rights reserved. Made with ❤️ for parents everywhere.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                  <Link
                    href="/terms"
                    className="text-pink-200/90 hover:text-white transition-colors whitespace-nowrap"
                  >
                    Terms of Service
                  </Link>
                  <Link
                    href="/privacy"
                    className="text-pink-200/90 hover:text-white transition-colors whitespace-nowrap"
                  >
                    Privacy Policy
                  </Link>
                </div>
                <a
                  href="https://www.trustpilot.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 bg-white px-4 py-3 rounded-xl hover:shadow-lg transition-all whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <FaStar className="h-5 w-5 text-[#00b67a]" />
                    <span className="font-semibold text-gray-900 text-sm">Trustpilot</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(4)].map((_, i) => (
                      <FaStar key={i} className="h-3 w-3 text-[#00b67a]" />
                    ))}
                    <div className="relative w-3 h-3">
                      <FaStar className="absolute inset-0 h-3 w-3 text-gray-300" />
                      <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                        <FaStar className="h-3 w-3 text-[#00b67a]" />
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
