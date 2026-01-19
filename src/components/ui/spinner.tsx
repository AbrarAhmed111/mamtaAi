'use client'

export default function Spinner({ size = 24, color = 'pink' }: { size?: number; color?: 'pink' | 'blue' | 'white' }) {
  const border = Math.max(2, Math.round(size / 12))
  const colorClasses = {
    pink: 'border-t-pink-600 border-r-pink-200',
    blue: 'border-t-blue-600 border-r-blue-200',
    white: 'border-t-white border-r-white/30'
  }
  return (
    <div
      className={`inline-block animate-spin rounded-full ${colorClasses[color]} border-gray-300`}
      style={{
        width: size,
        height: size,
        borderTopWidth: border,
        borderRightWidth: border,
        borderBottomWidth: border,
        borderLeftWidth: border,
      }}
      aria-label="Loading"
    />
  )
}


