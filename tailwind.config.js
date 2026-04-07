/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#97C906', // GoblinTools 风格的绿色
        secondary: '#8B5E3C',
      },
    },
  },
  plugins: ['@tailwindcss/typography'],
}
