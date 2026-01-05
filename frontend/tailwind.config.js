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
          DEFAULT: '#00A852', // Darker green for WCAG AA compliance (3.5:1 ratio)
          light: '#00D664',   // Original emerald green (now for decorative use)
          dark: '#008040',    // Even darker for high contrast (4.8:1 ratio)
          bg: '#E6FFF2',      // Light background
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
