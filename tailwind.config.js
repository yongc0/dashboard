/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        flood: {
          l1: '#22c55e',
          l2: '#eab308',
          l3: '#f97316',
          l4: '#ef4444',
        },
      },
    },
  },
  plugins: [],
}

