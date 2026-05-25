/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'bell-alert': {
          '0%, 100%': {
            transform: 'rotate(0deg) scale(1)',
            filter: 'drop-shadow(0 0 6px rgba(236, 72, 153, 0.85))',
          },
          '20%': { transform: 'rotate(-14deg) scale(1.08)' },
          '40%': { transform: 'rotate(14deg) scale(1.08)' },
          '60%': { transform: 'rotate(-10deg) scale(1.05)' },
          '80%': { transform: 'rotate(10deg) scale(1.05)' },
        },
        'chat-panel-in': {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'chat-message-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'chat-bubble-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'chat-typing': {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
        'chat-pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.7' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      animation: {
        'bell-alert': 'bell-alert 0.9s ease-in-out infinite',
        'chat-panel-in': 'chat-panel-in 260ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'chat-message-in': 'chat-message-in 260ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'chat-bubble-float': 'chat-bubble-float 3s ease-in-out infinite',
        'chat-typing': 'chat-typing 1.2s ease-in-out infinite',
        'chat-pulse-ring': 'chat-pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: '#002e6b',
        },
        blue: {
          400: '#3c6aa3',
          500: '#1b4e85',
          600: '#002e6b',
          700: '#002456',
        },
      },
    },
  },
  plugins: [],
};
