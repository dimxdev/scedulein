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
        brand: {
          sky: '#38BDF8',
          skyDeep: '#0284C7',
          sun: '#FBBF24',
          warmOrange: '#FB923C',
          violet: '#818CF8',
          darkBg: '#090D16',
          darkCard: '#111827',
          darkBorder: '#1F2937',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Quicksand', 'sans-serif'],
        display: ['Quicksand', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-sky': '0 0 25px -5px rgba(56, 189, 248, 0.4)',
        'glow-sun': '0 0 25px -5px rgba(251, 191, 36, 0.4)',
        'glow-purple': '0 0 25px -5px rgba(129, 140, 248, 0.4)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'float-reverse': 'floatRev 7s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        floatRev: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(8px) rotate(2deg)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        }
      }
    },
  },
  plugins: [],
}
