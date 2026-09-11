'use client'

import { useState } from 'react'
import { FaEnvelope, FaPaperPlane, FaCheckCircle, FaHeadset, FaClock } from 'react-icons/fa'
import LandingNav from '@/components/marketing/LandingNav'
import SiteFooter from '@/components/marketing/SiteFooter'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.name.trim().length < 2) return setError('Please enter your name.')
    if (!EMAIL_RE.test(form.email.trim())) return setError('Please enter a valid email address.')
    if (form.message.trim().length < 10) return setError('Message must be at least 10 characters.')

    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to send message.')
      setStatus('sent')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
      setStatus('idle')
    }
  }

  const inputClass =
    'w-full px-4 py-3 border border-pink-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all'

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <LandingNav activePage="contact" />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Heading */}
          <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-in">
            <span className="px-4 py-2 bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 rounded-full text-sm font-semibold border border-pink-200">
              Get in Touch
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl font-bold text-gray-900">
              We&apos;d Love to{' '}
              <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">
                Hear From You
              </span>
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Questions, feedback, or need help? Send us a message and our team will get back to you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Info cards */}
            <div className="space-y-4">
              {[
                { icon: FaEnvelope, title: 'Email us', text: 'support@mamtaai.com' },
                { icon: FaHeadset, title: 'Support', text: 'Help with your account & devices' },
                { icon: FaClock, title: 'Response time', text: 'Typically within 1–2 business days' },
              ].map(card => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-pink-100 bg-white/70 backdrop-blur-sm p-5 shadow-sm flex items-start gap-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                    <card.icon />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{card.title}</div>
                    <div className="text-sm text-gray-600">{card.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <div className="rounded-3xl border border-pink-100 bg-white shadow-xl p-6 sm:p-8">
                {status === 'sent' ? (
                  <div className="text-center py-10">
                    <FaCheckCircle className="mx-auto text-5xl text-green-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Message sent!</h2>
                    <p className="mt-2 text-gray-600">
                      Thanks for reaching out. We&apos;ll get back to you at your email shortly.
                    </p>
                    <button
                      onClick={() => setStatus('idle')}
                      className="mt-6 px-6 py-2.5 rounded-xl border-2 border-pink-300 text-pink-600 font-semibold hover:bg-pink-50 transition-colors"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={form.name} onChange={update('name')} placeholder="Your name" className={inputClass} required />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" className={inputClass} required />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                      <input type="text" value={form.subject} onChange={update('subject')} placeholder="What is this about?" className={inputClass} />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={form.message}
                        onChange={update('message')}
                        placeholder="How can we help?"
                        rows={6}
                        className={inputClass}
                        required
                      />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:from-pink-600 hover:to-rose-600 disabled:opacity-60 transition-all"
                    >
                      <FaPaperPlane />
                      {status === 'sending' ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
