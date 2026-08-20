/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 8px rgba(34, 211, 238, 0.6), 0 0 20px rgba(6, 182, 212, 0.4)',
        'neon-blue': '0 0 8px rgba(96, 165, 250, 0.6), 0 0 20px rgba(37, 99, 235, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 5px rgba(34, 211, 238, 0.5), 0 0 10px rgba(34, 211, 238, 0.3)',
            opacity: '1',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.9), 0 0 35px rgba(34, 211, 238, 0.6)',
            opacity: '0.85',
          },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.2' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        blink: 'blink 1.2s step-end infinite',
      },
    },
  },
  plugins: [],
}