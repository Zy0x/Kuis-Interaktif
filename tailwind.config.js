/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '360px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
      '4k': '2560px',
    },
    extend: {
      colors: {
        brand: {
          blue: '#2563EB',
          sky: '#0EA5E9',
          amber: '#F59E0B',
          yellow: '#FBBF24',
          emerald: '#10B981',
          coral: '#F43F5E',
          purple: '#8B5CF6',
          violet: '#7C3AED',
          cream: '#FFFBEB',
          surface: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Quicksand', 'Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'playful': '0 6px 0 0 rgba(0, 0, 0, 0.12)',
        'playful-sm': '0 3px 0 0 rgba(0, 0, 0, 0.1)',
        'playful-active': '0 1px 0 0 rgba(0, 0, 0, 0.15)',
        'card-glow': '0 10px 25px -5px rgba(59, 130, 246, 0.15)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
      keyframes: {
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.02)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      },
      animation: {
        'bounce-soft': 'bounce-soft 2.5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'wiggle': 'wiggle 0.4s ease-in-out',
        'pop-in': 'pop-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [],
}
