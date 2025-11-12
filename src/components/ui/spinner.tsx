'use client'

export default function Spinner({ size = 24 }: { size?: number }) {
  const border = Math.max(2, Math.round(size / 12))
  return (
    <div
      className="inline-block animate-spin rounded-full border-t-blue-600 border-gray-300"
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


