'use client'

import { FaArrowLeft, FaBook, FaComments, FaFolderOpen } from 'react-icons/fa'
import Link from 'next/link'

export default function CommunityGuidelinesPage() {
  return (
    <div className="w-full max-w-full mx-auto">
      <Link
        href="/dashboard/community"
        className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 mb-6"
      >
        <FaArrowLeft />
        Back to Community
      </Link>

      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-3">
            Community Guidelines
          </h1>
          <p className="text-lg text-gray-700 leading-relaxed">
            Welcome to our community! We&apos;re so glad you&apos;re here. This guide will help you make the most of sharing and connecting with other parents.
          </p>
        </div>

        {/* Blog Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-lg flex items-center justify-center">
              <FaBook className="text-2xl text-pink-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Writing Blog Posts</h2>
          </div>

          <div className="space-y-5 text-gray-700 leading-relaxed">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What makes a great blog post?</h3>
              <p className="mb-3">
                Our community loves reading about real experiences. Whether you&apos;re sharing what worked for your family, 
                documenting your journey, or offering expert advice, authenticity is key.
              </p>
              <ul className="list-disc list-inside space-y-1.5 ml-2">
                <li>Share personal stories and what you learned along the way</li>
                <li>Write step-by-step guides for things that helped you</li>
                <li>Review products or services you&apos;ve actually tried</li>
                <li>Celebrate milestones and share what made them special</li>
                <li>Offer health and wellness tips (but always remind readers to consult professionals)</li>
              </ul>
            </div>

            <div className="border-l-4 border-pink-300 pl-4 bg-pink-50 py-3 rounded-r">
              <p className="font-medium text-gray-900 mb-1">Quick tip</p>
              <p className="text-sm">
                A good title tells readers exactly what they&apos;ll learn. Instead of &quot;Help!&quot; try 
                &quot;5 Sleep Training Methods That Worked for My 6-Month-Old&quot;
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Formatting your post</h3>
              <p className="mb-2">Make your post easy to read:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-2">
                <li>Break up long paragraphs - use line breaks to create space</li>
                <li>Add a short summary (excerpt) - this shows up in previews</li>
                <li>Choose the right category so people can find it</li>
                <li>Add tags like &quot;newborn&quot; or &quot;breastfeeding&quot; to help with search</li>
                <li>Include a featured image if you have one - it makes posts more engaging</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium text-red-900 mb-1">Important reminders</p>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Never provide medical diagnoses or treatment plans - always direct to healthcare professionals</li>
                <li>• Be transparent about any affiliate links or sponsorships</li>
                <li>• Respect privacy - don&apos;t share others&apos; personal information</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Forum Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
              <FaComments className="text-2xl text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Starting Forum Discussions</h2>
          </div>

          <div className="space-y-5 text-gray-700 leading-relaxed">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What to post in forums</h3>
              <p className="mb-3">
                Forums are perfect for quick questions, sharing tips, or getting support. Think of them as 
                conversations with other parents who&apos;ve been where you are.
              </p>
              <ul className="list-disc list-inside space-y-1.5 ml-2">
                <li>Ask specific questions when you need advice</li>
                <li>Share quick tips that worked for you</li>
                <li>Start discussions about parenting topics</li>
                <li>Recommend local resources like doctors or services</li>
                <li>Seek support when you&apos;re facing challenges</li>
              </ul>
            </div>

            <div className="border-l-4 border-blue-300 pl-4 bg-blue-50 py-3 rounded-r">
              <p className="font-medium text-gray-900 mb-1">Getting better responses</p>
              <p className="text-sm mb-2">
                The more context you provide, the better others can help. Include details like:
              </p>
              <ul className="text-sm list-disc list-inside ml-2 space-y-1">
                <li>Your baby&apos;s age</li>
                <li>What you&apos;ve already tried</li>
                <li>Specific challenges you&apos;re facing</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Forum etiquette</h3>
              <p className="mb-2">Keep discussions helpful and respectful:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-2">
                <li>Search before posting - someone might have already asked your question</li>
                <li>Use clear, specific titles so people know what you&apos;re asking</li>
                <li>Choose the right category - it helps others find your thread</li>
                <li>Mark threads as solved when someone helps you - it helps future searchers</li>
                <li>Be kind, even when you disagree with someone</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="font-medium text-yellow-900 mb-1">A friendly reminder</p>
              <p className="text-sm text-yellow-800">
                We&apos;re all here to support each other. If you see a question you can answer, jump in! 
                Your experience might be exactly what another parent needs to hear.
              </p>
            </div>
          </div>
        </div>

        {/* Resources Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
              <FaFolderOpen className="text-2xl text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Sharing Resources</h2>
          </div>

          <div className="space-y-5 text-gray-700 leading-relaxed">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What to share</h3>
              <p className="mb-3">
                Resources are files and documents that can help other parents. Think about what would have 
                been useful when you were starting out, or what you wish someone had shared with you.
              </p>
              <div className="grid md:grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="font-medium text-gray-900 mb-1">Great resources include:</p>
                  <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                    <li>Checklists (feeding, milestones)</li>
                    <li>Printable templates</li>
                    <li>Activity worksheets</li>
                    <li>Visual guides and infographics</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Also helpful:</p>
                  <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                    <li>Sample schedules</li>
                    <li>Planning documents</li>
                    <li>Quick reference cards</li>
                    <li>Educational PDFs</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-green-300 pl-4 bg-green-50 py-3 rounded-r">
              <p className="font-medium text-gray-900 mb-1">Making your resource useful</p>
              <ul className="text-sm space-y-1">
                <li>• Write a clear description - explain what it is and how to use it</li>
                <li>• Choose the right type (checklist, guide, template, etc.)</li>
                <li>• Specify the age group it&apos;s designed for</li>
                <li>• Add tags so people can find it easily</li>
                <li>• Only share resources you created or have permission to share</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">File formats we support</h3>
              <p className="mb-2">
                We accept common file types that are easy for everyone to open:
              </p>
              <div className="flex flex-wrap gap-2">
                {['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'JPG', 'PNG'].map((format) => (
                  <span
                    key={format}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* General Guidelines */}
        <div className="bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 rounded-xl shadow-lg p-6 md:p-8 border border-pink-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Community Values</h2>
          <div className="space-y-4 text-gray-700">
            <p className="leading-relaxed">
              Above all, we&apos;re here to support each other. Parenting is hard enough without judgment 
              or criticism. We celebrate different approaches because what works for one family might not 
              work for another, and that&apos;s okay.
            </p>
            <div className="bg-white rounded-lg p-4 border border-pink-200">
              <p className="font-medium text-gray-900 mb-2">Remember:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-pink-600 mt-0.5">✓</span>
                  <span>Be respectful and kind in all interactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600 mt-0.5">✓</span>
                  <span>Share knowledge freely - your experience matters</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600 mt-0.5">✓</span>
                  <span>Respect privacy - yours and others&apos;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600 mt-0.5">✓</span>
                  <span>Always consult healthcare professionals for medical concerns</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600 mt-0.5">✓</span>
                  <span>Report anything that makes you uncomfortable</span>
                </li>
              </ul>
            </div>
            <p className="text-sm italic text-gray-600">
              We&apos;re all learning and growing together. Thank you for being part of this community!
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h3 className="font-semibold text-gray-900 mb-3">Ready to get started?</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/community/blog/create"
              className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors text-sm font-medium"
            >
              Write a Blog Post
            </Link>
            <Link
              href="/dashboard/community/forums/create"
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              Start a Discussion
            </Link>
            <Link
              href="/dashboard/community/resources/create"
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
            >
              Share a Resource
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
