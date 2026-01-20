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
        // Semantic Backgrounds (mapped to CSS vars)
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-surface': 'var(--color-bg-surface)',

        // Semantic Text
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',

        // Accent Colors (important!)
        accent: {
          DEFAULT: 'var(--color-accent-primary)',
          primary: 'var(--color-accent-primary)',
          secondary: 'var(--color-accent-secondary)',
        },

        // Status Colors
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',

        // Border
        border: 'var(--color-border)',

        // Legacy compatibility
        primary: {
          DEFAULT: 'var(--color-accent-primary)',
        },
        secondary: {
          DEFAULT: 'var(--color-accent-secondary)',
        },
      },
      fontFamily: {
        sans: ['var(--font-family-base)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-family-heading)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        md: 'var(--font-size-md)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        // Semantic Apple-style aliases
        'caption2': 'var(--font-size-xs)',
        'caption1': 'var(--font-size-sm)',
        'footnote': 'var(--font-size-sm)',
        'body': 'var(--font-size-md)',
        'headline': 'var(--font-size-lg)',
        'title3': 'var(--font-size-xl)',
        'title2': 'var(--font-size-2xl)',
        'title1': 'var(--font-size-3xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      spacing: {
        '0': '0px',
        '0.5': 'var(--space-0.5)',
        '1': 'var(--space-1)',
        '1.5': 'var(--space-1.5)',
        '2': 'var(--space-2)',
        '2.5': 'var(--space-2.5)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
        '12': 'var(--space-12)',
        '16': 'var(--space-16)',
        '20': 'var(--space-20)',
        '24': 'var(--space-24)',
        // Legacy aliases
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        focus: 'var(--focus-ring)',
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
        normal: 'var(--transition-normal)',
        slow: 'var(--transition-slow)',
      },
    },
  },
  plugins: [],
}
