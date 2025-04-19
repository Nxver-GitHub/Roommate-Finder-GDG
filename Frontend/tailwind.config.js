/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#4371CB',
        secondary: '#F0D264',
        success: '#3AB795',
        darkgreen: '#1B5E41',
        background: {
          DEFAULT: '#121212',
          elevated: '#1F2937',
          input: '#333333',
        },
      },
      fontFamily: {
        poppins: ['Poppins'],
        inter: ['Inter'],
      }
    },
  },
  plugins: [],
} 