/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic Backgrounds
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-surface': 'var(--color-bg-surface)',

        // Semantic Text
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',

        // Component Level
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          text: 'var(--color-primary-text)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          hover: 'var(--color-secondary-hover)',
          text: 'var(--color-secondary-text)',
        },
        border: 'var(--color-border)',

        // Legacy/Direct mappings if needed for backward compatibility
        // (Keeping accent as is for now or mapping it if we added it)
        accent: {
          DEFAULT: '#FFB800',
        }
      },
      fontFamily: {
        sans: ['var(--font-family-base)', 'sans-serif', 'system-ui'],
        heading: ['var(--font-family-heading)', 'sans-serif', 'system-ui'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': '1rem', // Fallbacks or manual
        '3xl': '1.5rem',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--color-shadow)',
        md: '0 4px 6px -1px var(--color-shadow), 0 2px 4px -1px var(--color-shadow)',
        lg: '0 10px 15px -3px var(--color-shadow), 0 4px 6px -2px var(--color-shadow)',
      },
    },
  },
  plugins: [],
}
