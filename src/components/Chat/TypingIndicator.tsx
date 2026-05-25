'use client'

export default function TypingIndicator() {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-pink-100 bg-white px-4 py-3 shadow-sm"
      aria-label="MamtaBot is thinking"
    >
      <span
        className="block h-2 w-2 rounded-full bg-pink-400 animate-chat-typing"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="block h-2 w-2 rounded-full bg-pink-400 animate-chat-typing"
        style={{ animationDelay: '180ms' }}
      />
      <span
        className="block h-2 w-2 rounded-full bg-pink-400 animate-chat-typing"
        style={{ animationDelay: '360ms' }}
      />
    </div>
  )
}
