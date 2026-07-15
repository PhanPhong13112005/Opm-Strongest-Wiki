/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'opm-dark': '#0b0c10',
        'opm-darker': '#050608',
        'opm-gray': '#1f2833',
        'opm-card': '#1a1c23',
        'opm-red': '#ff3366',
        'opm-orange': '#f5a623',
        'opm-gold': '#ffc107',
        'opm-blue': '#45a29e',
        'opm-cyan': '#66fcf1',
        'ur-red': '#ff1a1a',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-red': '0 0 15px rgba(255, 51, 102, 0.5)',
        'glow-gold': '0 0 15px rgba(245, 166, 35, 0.5)',
      }
    },
  },
  plugins: [],
}
