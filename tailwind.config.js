/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#E8F5F1',
          100: '#C3E5D9',
          200: '#9DD4C1',
          300: '#6DBFA3',
          400: '#3DAA85',
          500: '#0D9E75',
          600: '#0D6E5B',
          700: '#095247',
          800: '#063733',
          900: '#031D1E',
        },
        coral: {
          50:  '#FDF0ED',
          400: '#E8593C',
          600: '#C03E22',
        },
        cream: '#FAF7F2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
