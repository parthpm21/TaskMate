/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#f5a623',
        'accent-dark': '#d4891a',
        surface: '#111111',
        card: '#161616',
        border: '#222222',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        head: ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
