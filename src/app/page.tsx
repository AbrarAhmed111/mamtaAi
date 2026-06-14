

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
  FaClock,
  FaLock,
  FaCheckCircle
} from 'react-icons/fa';
import motherAndBaby from '@/assets/img/motherandbaby.png'
import Image from 'next/image';
import LandingNav from '@/components/marketing/LandingNav';
import OximeterLandingSection from '@/components/marketing/OximeterLandingSection';
import SiteFooter from '@/components/marketing/SiteFooter';


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
      answer: "No special equipment is required. Use your smartphone's microphone to record cries in the app. Optional oximeter integration is available for enhanced health monitoring, but it's completely optional."
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
      <LandingNav activePage="home" />

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

      <OximeterLandingSection />

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
            <Link
              href={user ? '/dashboard' : '/welcome'}
              className="bg-white text-pink-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
            >
              Get started free
            </Link>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-pink-600 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  )
}
