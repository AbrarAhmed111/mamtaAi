import { FaUser } from 'react-icons/fa'
import { DETAIL_HERO_CLASS } from './detailStyles'
import DetailStat from './DetailStat'
import { highResAvatar } from '@/lib/utils/avatar'

export type ProfileHeroStat = {
  label: string
  value: React.ReactNode
}

type ProfileHeroProps = {
  imageUrl?: string | null
  name: string
  subtitle?: React.ReactNode
  badges?: React.ReactNode
  action?: React.ReactNode
  stats?: ProfileHeroStat[]
  placeholderClassName?: string
  imageAlt?: string
}

export default function ProfileHero({
  imageUrl,
  name,
  subtitle,
  badges,
  action,
  stats = [],
  placeholderClassName = 'bg-gray-50',
  imageAlt,
}: ProfileHeroProps) {
  const heroImage = highResAvatar(imageUrl)
  return (
    <section className={DETAIL_HERO_CLASS}>
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/3">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
              alt={imageAlt || name}
              className="h-64 w-full object-cover md:h-full"
            />
          ) : (
            <div
              className={`flex h-64 w-full items-center justify-center md:h-full ${placeholderClassName}`}
            >
              <FaUser className="text-5xl text-gray-300" />
            </div>
          )}
        </div>
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                {name}
              </h1>
              {subtitle ? <p className="mt-2 text-gray-600">{subtitle}</p> : null}
              {badges ? <div className="mt-2 flex flex-wrap items-center gap-2">{badges}</div> : null}
            </div>
            {action}
          </div>
          {stats.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              {stats.map(stat => (
                <DetailStat key={stat.label} label={stat.label} value={stat.value} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
