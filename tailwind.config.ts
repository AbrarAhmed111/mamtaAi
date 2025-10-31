/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
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
