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
          DEFAULT: '#00D664', // Emerald Green from the screen references
          dark: '#00A852',
          light: '#E6FFF2',
        },
        secondary: {
          DEFAULT: '#111827', // Deep slate/black
        },
        accent: {
          DEFAULT: '#FFB800', // Yellow for highlights/warner
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif', 'system-ui'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}
