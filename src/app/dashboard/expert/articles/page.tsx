import Link from 'next/link'

export default function ExpertArticlesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
        Expert articles
      </h1>
      <div className="rounded-2xl border border-dashed border-pink-200 bg-white/80 p-10 text-center">
        <p className="text-sm text-gray-600">
          Article authoring for experts is coming soon. For now, community blog posts can be created from the{' '}
          <Link href="/dashboard/community" className="font-medium text-pink-600 hover:text-pink-700">
            Community
          </Link>{' '}
          section.
        </p>
      </div>
    </div>
  )
}
