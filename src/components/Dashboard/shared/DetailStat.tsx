export default function DetailStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-pink-100 bg-gradient-to-br from-pink-50/50 to-rose-50/50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-pink-600">{label}</div>
      <div className="mt-1 font-medium text-gray-900">{value}</div>
    </div>
  )
}
