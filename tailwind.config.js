/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: '#5b4fe8',
        success: '#34d399',
        danger: '#f87171',
        warn: '#fbbf24',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
