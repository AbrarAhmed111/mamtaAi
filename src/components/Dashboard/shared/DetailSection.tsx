import { DETAIL_SECTION_CLASS } from './detailStyles'

export default function DetailSection({
  title,
  children,
  titleClassName = 'text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent',
}: {
  title: string
  children: React.ReactNode
  titleClassName?: string
}) {
  return (
    <section className={DETAIL_SECTION_CLASS}>
      <h2 className={`mb-4 ${titleClassName}`}>{title}</h2>
      {children}
    </section>
  )
}
