
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/context';
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
  FaTimes
} from 'react-icons/fa';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModule, setActiveModule] = useState(0);
  const router = useRouter();
  const { user } = useAuth();

  // Redirect signed-in users to dashboard
  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const modules = [
    {
      id: 1,
      title: "User Registration & Authentication",
      icon: FaShieldAlt,
      description: "Secure user accounts and profile management for parents",
      features: ["Signup/Login", "Password Reset", "Profile Management", "Secure Access"]
    },
    {
      id: 2,
      title: "Baby Profile Management",
      icon: FaBaby,
      description: "Organized baby information for personalized predictions",
      features: ["Multiple Babies", "Medical History", "Feeding Records", "Sleep Tracking"]
    },
    {
      id: 3,
      title: "Audio Recording",
      icon: FaMicrophone,
      description: "High-quality cry capture with noise reduction",
      features: ["Live Recording", "Upload Audio", "Noise Reduction", "Save Recordings"]
    },
    {
      id: 4,
      title: "Community Support & Parent Network",
      icon: FaUsers,
      description: "Connect with other parents and access expert guidance",
      features: ["Community Blog", "Discussion Forums", "Resource Sharing", "Trustpilot Reviews"]
    },
    {
      id: 5,
      title: "Feature Extraction (AI/ML)",
      icon: FaBrain,
      description: "Advanced audio analysis using machine learning",
      features: ["MFCC Extraction", "Spectrogram Analysis", "Pitch Analysis", "Duration Analysis"]
    },
    {
      id: 6,
      title: "Baby Cry Classification (AI Model)",
      icon: FaCog,
      description: "Core AI intelligence for cry interpretation",
      features: ["Model Training", "Cry Prediction", "Confidence Scoring", "Model Improvement"]
    },
    {
      id: 7,
      title: "Translation Output",
      icon: FaMobile,
      description: "User-friendly results and actionable suggestions",
      features: ["Text Display", "Multiple Suggestions", "Urgency Indicators", "Solution Tips"]
    },
    {
      id: 8,
      title: "Parent Dashboard",
      icon: FaChartLine,
      description: "Comprehensive analytics and insights",
      features: ["Daily Stats", "Graphical Reports", "Cry History", "Health Suggestions"]
    },
    {
      id: 9,
      title: "Secure Notification & Data Privacy",
      icon: FaBell,
      description: "Real-time alerts with robust security",
      features: ["Real-Time Notifications", "Custom Alerts", "Encrypted Data", "Privacy Control"]
    },
    {
      id: 10,
      title: "Oximeter Module (Hardware Integration)",
      icon: FaHeartbeat,
      description: "Real-time vital signs monitoring",
      features: ["Oximeter Readings", "Data Visualization", "Health Alerts", "Vital History"]
    },
    {
      id: 11,
      title: "Payment & Subscription",
      icon: FaCreditCard,
      description: "Flexible subscription plans and secure payments",
      features: ["Plan Selection", "Secure Payments", "Subscription Management", "Premium Benefits"]
    },
    {
      id: 12,
      title: "Learning & Feedback System",
      icon: FaGraduationCap,
      description: "Continuous AI improvement through user feedback",
      features: ["User Feedback", "Model Re-training", "Custom Labels", "Personalized Adaptation"]
    }
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-lg z-50 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="flex items-center group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative bg-white p-2 rounded-full">
                  <FaBaby className="h-8 w-8 text-blue-600 group-hover:text-purple-600 transition-colors duration-300" />
                </div>
              </div>
              <div className="ml-3">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MamtaAI
                </span>
                <div className="text-xs text-gray-500 font-medium">AI-Powered Baby Care</div>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-1">
                <a href="#home" className="relative px-4 py-2 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors duration-200 group">
                  Home
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
                </a>
                <a href="#modules" className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 group">
                  Modules
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
                </a>
                <a href="#features" className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 group">
                  Features
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
                </a>
                <a href="#testimonials" className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 group">
                  Testimonials
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
                </a>
                <a href="#contact" className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 group">
                  Contact
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
                </a>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/welcome" className="text-gray-600 hover:text-blue-600 px-4 py-2 text-sm font-medium transition-colors duration-200">
                Sign In
              </Link>
              <Link href="/welcome" className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Get Started
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              </Link>
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
              <a href="#home" className="block px-3 py-3 text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200">Home</a>
              <a href="#modules" className="block px-3 py-3 text-base font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200">Modules</a>
              <a href="#features" className="block px-3 py-3 text-base font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200">Features</a>
              <a href="#testimonials" className="block px-3 py-3 text-base font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200">Testimonials</a>
              <a href="#contact" className="block px-3 py-3 text-base font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200">Contact</a>
              <div className="pt-4 border-t border-gray-200">
                <Link href="/welcome" className="block px-3 py-3 text-base font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200">Sign In</Link>
                <Link href="/welcome" className="block px-3 py-3 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300">Get Started</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-40 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Understanding Your Baby&apos;s
              <span className="text-blue-600 block">Every Cry</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Revolutionary AI-powered baby cry translation system that helps parents understand their baby&apos;s needs instantly. 
              From hunger to pain, we decode every cry with precision and care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center">
                <FaPlay className="mr-2" />
                Watch Demo
              </button>
              <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center">
                <FaDownload className="mr-2" />
                Download App
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive AI-Powered Modules
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our 12 integrated modules work together to provide the most accurate and comprehensive baby cry analysis system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((module, index) => (
              <div
                key={module.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100"
              >
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <module.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{module.description}</p>
                <ul className="space-y-2">
                  {module.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-600">
                      <FaCheck className="h-4 w-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
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
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Understand Your Baby Better?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the future of parenting with AI-powered baby cry translation. 
            Start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
              Start Free Trial
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
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
                  <li><a href="#modules" className="text-blue-200 hover:text-white transition-colors duration-200 flex items-center group">
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    Features
                  </a></li>
                  <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-200 flex items-center group">
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    Pricing
                  </a></li>
                  <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-200 flex items-center group">
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    Download App
                  </a></li>
                  <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-200 flex items-center group">
                    <FaArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    API Access
                  </a></li>
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
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="text-blue-200 text-sm mb-4 md:mb-0">
                  © 2024 MamtaAI. All rights reserved. Made with ❤️ for parents everywhere.
                </div>
                <div className="flex space-x-6 text-sm">
                  <a href="#" className="text-blue-200 hover:text-white transition-colors duration-200">Terms of Service</a>
                  <a href="#" className="text-blue-200 hover:text-white transition-colors duration-200">Privacy Policy</a>
                  <a href="#" className="text-blue-200 hover:text-white transition-colors duration-200">Cookie Policy</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
