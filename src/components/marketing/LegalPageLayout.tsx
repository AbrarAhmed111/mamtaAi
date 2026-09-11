import Link from 'next/link'
import LandingNav from '@/components/marketing/LandingNav'
import SiteFooter from '@/components/marketing/SiteFooter'

type LegalSection = {
  title: string
  paragraphs: string[]
  list?: string[]
}

type LegalPageLayoutProps = {
  title: string
  description: string
  lastUpdated: string
  sections: LegalSection[]
}

export default function LegalPageLayout({
  title,
  description,
  lastUpdated,
  sections,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex flex-col">
      <LandingNav activePage="home" />

      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-pink-100/80 bg-white shadow-lg shadow-pink-100/30 p-6 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">Legal</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">{title}</h1>
            <p className="mt-3 text-gray-600 leading-relaxed">{description}</p>
            <p className="mt-2 text-xs text-gray-500">Last updated: {lastUpdated}</p>

            <div className="mt-10 space-y-8">
              {sections.map(section => (
                <section key={section.title}>
                  <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                  <div className="mt-3 space-y-3 text-sm text-gray-600 leading-relaxed">
                    {section.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                    {section.list && (
                      <ul className="list-disc pl-5 space-y-1.5">
                        {section.list.map(item => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-pink-100 flex flex-wrap gap-4 text-sm">
              <Link href="/" className="text-pink-600 font-medium hover:underline">
                ← Back to home
              </Link>
              <Link href="/privacy" className="text-gray-500 hover:text-pink-600">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-pink-600">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
