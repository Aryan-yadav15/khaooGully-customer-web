/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00A86B', // The vibrant Emerald Green from the image
          light: '#E6F7F1',   // The Mint Green background
          dark: '#008f5d',
        },
        accent: {
          DEFAULT: '#FFC107', // The Mustard/Orange highlight
          light: '#FFF8E1',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          background: '#F3F4F6', // Light gray background
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Clean, modern font
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
