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
        cyber: {
          bg: '#07090e',
          surface: '#0d111a',
          card: '#121824',
          border: '#1e293b',
          borderSubtle: 'rgba(255, 255, 255, 0.08)',
          accent: '#06b6d4',
          accentGlow: 'rgba(6, 182, 212, 0.25)',
          emerald: '#10b981',
          emeraldGlow: 'rgba(16, 185, 129, 0.25)',
          amber: '#f59e0b',
          amberGlow: 'rgba(245, 158, 11, 0.25)',
          crimson: '#ef4444',
          crimsonGlow: 'rgba(239, 68, 68, 0.25)',
          textMuted: '#94a3b8',
          textBright: '#f8fafc'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar-sweep 3s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.02)' }
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      }
    },
  },
  plugins: [],
}
