

'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/context';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FaBaby, 
  FaMicrophone, 
  FaBrain, 
  FaHeartbeat, 
  FaUsers, 
  FaShieldAlt,
  FaChartLine,
  FaBell,
  FaCreditCard,
  FaGraduationCap,
  FaCog,
  FaMobile,
  FaArrowRight,
  FaCheck,
  FaStar,
  FaPlay,
  FaDownload,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaBars,
  FaTimes,
  FaClock,
  FaLock,
  FaCheckCircle
} from 'react-icons/fa';
import logo from '@/assets/img/smallLogo.png'
import motherAndBaby from '@/assets/img/motherandbaby.png'
import Image from 'next/image';


function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How accurate is the cry translation?",
      answer: "MamtaAI uses advanced machine learning algorithms trained on thousands of cry samples, achieving over 95% accuracy in identifying common baby needs like hunger, sleep, discomfort, and pain. Our AI continuously learns and improves from user feedback to provide even more accurate results over time."
    },
    {
      question: "Is my baby's data secure?",
      answer: "Absolutely. We use end-to-end encryption and follow strict privacy protocols. Your baby's information is never shared with third parties, and you have full control over your data. We are HIPAA compliant and meet the highest standards for health data protection and privacy."
    },
    {
      question: "Can I use it for multiple babies?",
      answer: "Yes! MamtaAI supports multiple baby profiles, allowing you to track and understand each child's unique communication patterns and needs. You can easily switch between profiles and maintain separate records for each baby."
    },
    {
      question: "Do I need special equipment?",
      answer: "No special equipment is required. You can use your smartphone's microphone to record cries, or upload existing audio files. Optional oximeter integration is available for enhanced health monitoring, but it's completely optional."
    },
    {
      question: "Is there a mobile app?",
      answer: "MamtaAI is fully accessible through your web browser and works seamlessly on mobile devices. Our responsive design ensures a great experience on any device. A dedicated mobile app is coming soon for even better convenience and offline capabilities."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time with no penalties or hidden fees. Your data will remain accessible during your active subscription period, and you can export your data before cancellation if needed."
    },
    {
      question: "How does the AI learn my baby's specific patterns?",
      answer: "MamtaAI uses a combination of general AI models trained on thousands of cry samples and personalized learning based on your feedback. When you confirm or correct predictions, the system adapts to better understand your baby's unique communication style over time."
    },
    {
      question: "What languages are supported?",
      answer: "Currently, MamtaAI supports English interface with cry analysis that works universally across all languages. We're working on adding multi-language support for the interface in the near future."
    },
    {
      question: "Can healthcare professionals use MamtaAI?",
      answer: "Yes! Many pediatricians and healthcare professionals use MamtaAI as a supplementary tool to better understand their young patients. However, it's important to note that MamtaAI is not a replacement for professional medical advice and should be used as a supportive tool."
    },
    {
      question: "What age range does MamtaAI work best for?",
      answer: "MamtaAI is designed to work with babies from newborn to 24 months old. The AI has been trained on cry samples across this age range and can accurately interpret cries throughout your baby's early development stages."
    }
  ];

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-inset group"
          >
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 pr-8 group-hover:text-pink-600 transition-colors">
              {faq.question}
            </h3>
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                <FaArrowRight className="h-4 w-4 text-white transform -rotate-90" />
              </div>
            </div>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-6 pb-5 pt-0">
              <div className="pt-4 border-t border-gray-100">
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HomeContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const qs = useSearchParams();

  // If root receives Supabase error params for expired/invalid email link, route to resend page
  useEffect(() => {
    const error = qs?.get('error') || ''
    const code = qs?.get('error_code') || ''
    const desc = qs?.get('error_description') || ''
    const expired = code === 'otp_expired' || /expired|invalid/i.test(error + ' ' + desc)
    if (expired) {
      router.replace('/verify-email?error=true&message=' + encodeURIComponent(desc || 'Email link is invalid or has expired'))
    }
  }, [qs, router]);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Mother of Twins",
      content: "MamtaAI has been a lifesaver! Understanding my babies' cries has never been easier.",
      rating: 5
    },
    {
      name: "Dr. Michael Chen",
      role: "Pediatrician",
      content: "This technology is revolutionary. It helps parents make informed decisions about their baby's needs.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "First-time Mother",
      content: "The community support and AI insights have given me so much confidence as a new parent.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      {/* Enhanced Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-lg z-50 border-b border-pink-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="flex items-center group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative ">
                  <Image src={logo} alt='' className="h-16 rounded-full w-16 text-blue-600 group-hover:text-purple-600 transition-colors duration-300" />
                </div>
              </div>
              <div className="ml-3">
                <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">
                  MamtaAI
                </span>
                <div className="text-xs text-gray-500 font-medium">AI-Powered Baby Care</div>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-1">
                <a href="#home" className="relative px-4 py-2 text-sm font-medium text-gray-900 hover:text-pink-600 transition-colors duration-200 group">
                  Home
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 group-hover:w-full transition-all duration-300"></span>
                </a>
                <a href="#features" className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-pink-600 transition-colors duration-200 group">
                  Features
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 group-hover:w-full transition-all duration-300"></span>
                </a>
                <a href="#faq" className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-pink-600 transition-colors duration-200 group">
                  FAQ
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 group-hover:w-full transition-all duration-300"></span>
                </a>
                <a href="#testimonials" className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-pink-600 transition-colors duration-200 group">
                  Testimonials
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 group-hover:w-full transition-all duration-300"></span>
                </a>
                <a href="#contact" className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-pink-600 transition-colors duration-200 group">
                  Contact
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 group-hover:w-full transition-all duration-300"></span>
                </a>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard" className="relative bg-gradient-to-r from-pink-500 to-rose-500 !text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Dashboard
               
                </Link>
              ) : (
                <>
                  <Link href="/welcome" className="text-gray-600 hover:text-pink-600 px-4 py-2 text-sm font-medium transition-colors duration-200">
                    Sign In
                  </Link>
                  <Link href="/welcome" className="relative bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    Get Started
                   
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <FaTimes className="h-6 w-6" />
                ) : (
                  <FaBars className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-200/50 shadow-lg">
            <div className="px-4 pt-2 pb-3 space-y-1">
              <a href="#home" className="block px-3 py-3 text-base font-medium text-gray-900 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors duration-200">Home</a>
              <a href="#features" className="block px-3 py-3 text-base font-medium text-gray-600 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors duration-200">Features</a>
              <a href="#faq" className="block px-3 py-3 text-base font-medium text-gray-600 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors duration-200">FAQ</a>
              <a href="#testimonials" className="block px-3 py-3 text-base font-medium text-gray-600 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors duration-200">Testimonials</a>
              <a href="#contact" className="block px-3 py-3 text-base font-medium text-gray-600 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors duration-200">Contact</a>
                <div className="pt-4 border-t border-gray-200">
                  {user ? (
                    <Link href="/dashboard" className="block px-3 py-3 text-base font-medium bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300">Dashboard</Link>
                  ) : (
                    <>
                      <Link href="/welcome" className="block px-3 py-3 text-base font-medium text-gray-600 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors duration-200">Sign In</Link>
                      <Link href="/welcome" className="block px-3 py-3 text-base font-medium bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300">Get Started</Link>
                    </>
                  )}
                </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Heading & Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="inline-block">
                <span className="px-4 py-2 bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 rounded-full text-sm font-semibold border border-pink-200">
                  AI-Powered Baby Care
                </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-gray-900">Understanding Your</span>
                <br />
                <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">
                  Baby&apos;s Every Cry
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-xl">
                Revolutionary AI-powered baby cry translation system that helps parents understand their baby&apos;s needs instantly. 
                From hunger to pain, we decode every cry with <span className="text-pink-600 font-semibold">precision and care</span>.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link 
                  href={user ? "/dashboard" : "/welcome"}
                  className="group relative bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
                >
                  <span>Get Started Free</span>
                  <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="border-2 border-pink-300 text-pink-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-pink-50 transition-all duration-300 flex items-center justify-center">
                  <FaPlay className="mr-2" />
                  Watch Demo
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div>
                  <div className="text-3xl font-bold text-pink-600">95%+</div>
                  <div className="text-sm text-gray-600">Accuracy Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-rose-600">10K+</div>
                  <div className="text-sm text-gray-600">Happy Parents</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">24/7</div>
                  <div className="text-sm text-gray-600">Support</div>
                </div>
              </div>
            </div>

            {/* Right Side - Media */}
            <div className="relative lg:pl-8">
              <div className="relative">
                {/* Decorative Elements */}
                <div className="absolute -top-8 -right-8 w-64 h-64 bg-gradient-to-br from-pink-200 to-rose-200 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                <div className="absolute -bottom-8 -left-8 w-56 h-56 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl opacity-50 animate-pulse delay-1000"></div>
                
                {/* Main Image Container */}
                <div className="relative z-10">
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 z-10"></div>
                    
                    {/* Image */}
                    <div className="relative aspect-[4/5] lg:aspect-square">
                      <Image
                        src={motherAndBaby}
                        alt="Mother and baby - AI-powered baby care"
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                    
                    {/* Floating Badge */}
                    {/* <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-pink-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-400 rounded-xl flex items-center justify-center">
                          <FaBaby className="text-white text-xl" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">AI Analysis</div>
                          <div className="text-xs text-gray-600">Real-time insights</div>
                        </div>
                      </div>
                    </div> */}
                  </div>
                  
                  {/* Decorative Cards */}
                  <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border border-rose-100 hidden lg:block animate-float">
                    <div className="flex items-center space-x-2">
                      <FaHeartbeat className="text-rose-500 text-xl" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Health Monitor</div>
                        <div className="text-xs text-gray-600">Vital signs tracking</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* <div className="absolute -top-6 -right-6 bg-white rounded-2xl p-4 shadow-xl border border-purple-100 hidden lg:block animate-float-delayed">
                    <div className="flex items-center space-x-2">
                      <FaBrain className="text-purple-500 text-xl" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Smart AI</div>
                        <div className="text-xs text-gray-600">Machine learning</div>
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose MamtaAI?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced technology meets compassionate care to support parents in their most important journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBrain className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-600">Advanced machine learning algorithms analyze cry patterns with 95%+ accuracy.</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHeartbeat className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Health Monitoring</h3>
              <p className="text-gray-600">Integrated oximeter support for comprehensive baby health tracking.</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUsers className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Support</h3>
              <p className="text-gray-600">Connect with other parents and access expert guidance.</p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShieldAlt className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Privacy First</h3>
              <p className="text-gray-600">End-to-end encryption ensures your baby&apos;s data stays private and secure.</p>
            </div>

            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBell className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-Time Alerts</h3>
              <p className="text-gray-600">Instant notifications help you respond quickly to your baby&apos;s needs.</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaChartLine className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Analytics</h3>
              <p className="text-gray-600">Detailed insights and patterns to better understand your baby&apos;s behavior.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Parents Love MamtaAI
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the benefits that make parenting easier and more confident
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-pink-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <FaHeartbeat className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Reduce Stress</h3>
              <p className="text-gray-600">No more guessing games. Know exactly what your baby needs, reducing parental anxiety and stress.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <FaClock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Save Time</h3>
              <p className="text-gray-600">Get instant answers instead of trying multiple solutions. Respond faster to your baby&apos;s needs.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <FaGraduationCap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Learn & Grow</h3>
              <p className="text-gray-600">Build confidence as a parent by understanding your baby&apos;s communication patterns over time.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <FaUsers className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Support</h3>
              <p className="text-gray-600">Connect with other parents, share experiences, and access expert guidance in our community.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <FaShieldAlt className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Privacy Protected</h3>
              <p className="text-gray-600">Your baby&apos;s data is encrypted and secure. We prioritize your family&apos;s privacy above all.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <FaChartLine className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Track Progress</h3>
              <p className="text-gray-600">Monitor your baby&apos;s patterns and health trends with detailed analytics and insights.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about MamtaAI
            </p>
          </div>

          <FAQAccordion />
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Parents Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of parents who trust MamtaAI to understand their baby&apos;s needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="h-5 w-5 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">&ldquo;{testimonial.content}&rdquo;</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Understand Your Baby Better?
          </h2>
          <p className="text-xl text-pink-50 mb-8 max-w-2xl mx-auto">
            Join the future of parenting with AI-powered baby cry translation. 
            Start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-pink-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
              Start Free Trial
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-pink-600 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer id="contact" className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          {/* Newsletter Section */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Stay Updated with MamtaAI</h3>
                <p className="text-blue-100 mb-6">Get the latest updates on AI-powered baby care technology</p>
                <div className="max-w-md mx-auto flex gap-4">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Footer Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Company Info */}
              <div className="lg:col-span-1">
                <div className="flex items-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-75"></div>
                    <div className="relative bg-white/10 p-3 rounded-full">
                      <FaBaby className="h-8 w-8 text-blue-300" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                      MamtaAI
                    </span>
                    <div className="text-xs text-blue-200 font-medium">AI-Powered Baby Care</div>
                  </div>
                </div>
                <p className="text-blue-100 mb-6 leading-relaxed">
                  Revolutionary AI-powered baby cry translation system helping parents understand their baby&apos;s needs with precision and care.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-blue-500 hover:scale-110 transition-all duration-300 group">
                    <FaFacebook className="h-5 w-5 text-gray-300 group-hover:text-white" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-blue-500 hover:scale-110 transition-all duration-300 group">
                    <FaTwitter className="h-5 w-5 text-gray-300 group-hover:text-white" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-blue-500 hover:scale-110 transition-all duration-300 group">
                    <FaInstagram className="h-5 w-5 text-gray-300 group-hover:text-white" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-blue-500 hover:scale-110 transition-all duration-300 group">
                    <FaLinkedin className="h-5 w-5 text-gray-300 group-hover:text-white" />
                  </a>
                </div>
              </div>

              {/* Product Links */}
              <div>
                <h3 className="text-lg font-semibold mb-6 text-white">Product</h3>
                <ul className="space-y-3">
                  <li><a href="#features" className="text-blue-200 hover:text-white transition-colors duration-200 flex items-center group">
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    Features
                  </a></li>
                  <li><a href="#faq" className="text-blue-200 hover:text-white transition-colors duration-200 flex items-center group">
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    FAQ
                  </a></li>
                  <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-200 flex items-center group">
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    Pricing
                  </a></li>
                  {/* <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-200 flex items-center group">
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    Download App
                  </a></li> */}
                  {/* <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-200 flex items-center group">
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    API Access
                  </a></li> */}
                </ul>
              </div>

              {/* Support Links */}
              <div>
                <h3 className="text-lg font-semibold mb-6 text-white">Support</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-200 flex items-center group">
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    Help Center
                  </a></li>
                  <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-200 flex items-center group">
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    Community Forum
                  </a></li>
                  <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-200 flex items-center group">
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    Contact Support
                  </a></li>
                  <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-200 flex items-center group">
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    Privacy Policy
                  </a></li>
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-lg font-semibold mb-6 text-white">Get in Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-center group">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-500/30 transition-colors duration-200">
                      <FaEnvelope className="h-4 w-4 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-blue-200 text-sm">Email us</p>
                      <p className="text-white font-medium">support@mamtaai.com</p>
                    </div>
                  </div>
                  <div className="flex items-center group">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-500/30 transition-colors duration-200">
                      <FaPhone className="h-4 w-4 text-purple-300" />
                    </div>
                    <div>
                      <p className="text-blue-200 text-sm">Call us</p>
                      <p className="text-white font-medium">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-center group">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-500/30 transition-colors duration-200">
                      <FaMapMarkerAlt className="h-4 w-4 text-green-300" />
                    </div>
                    <div>
                      <p className="text-blue-200 text-sm">Visit us</p>
                      <p className="text-white font-medium">San Francisco, CA</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-white/10 mt-12 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-blue-200 text-sm mb-4 md:mb-0">
                  © 2024 MamtaAI. All rights reserved. Made with ❤️ for parents everywhere.
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                    <a href="#" className="text-blue-200 hover:text-white transition-colors duration-200 whitespace-nowrap">Terms of Service</a>
                    <a href="#" className="text-blue-200 hover:text-white transition-colors duration-200 whitespace-nowrap">Privacy Policy</a>
                    <a href="#" className="text-blue-200 hover:text-white transition-colors duration-200 whitespace-nowrap">Cookie Policy</a>
                  </div>
                  {/* Trustpilot Badge */}
                  <a 
                    href="https://www.trustpilot.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 bg-white px-4 py-3 rounded-lg hover:shadow-lg transition-all duration-200 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      <FaStar className="h-5 w-5 text-[#00b67a]" />
                      <span className="font-semibold text-gray-900 text-sm">Trustpilot</span>
                    </div>
                    {/* Star Rating - 4.5 stars */}
                    <div className="flex items-center gap-0.5">
                      {/* 4 full stars */}
                      {[...Array(4)].map((_, i) => (
                        <FaStar key={i} className="h-3 w-3 text-[#00b67a]" />
                      ))}
                      {/* Half star */}
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
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="px-4 py-6">Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}
