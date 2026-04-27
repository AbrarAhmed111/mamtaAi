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
      },
      animation: {
        'bell-alert': 'bell-alert 0.9s ease-in-out infinite',
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
