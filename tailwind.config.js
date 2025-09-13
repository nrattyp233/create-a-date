/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./constants.tsx",
    "./types.ts",
  ],
  theme: {
    extend: {
      colors: {
        'brand-pink': '#F91880',
        'brand-purple': '#A020F0',
        'brand-light': '#FFD7F3',
        'dark-1': '#121212',
        'dark-2': '#1E1E1E',
        'dark-3': '#2A2A2A',
        'light-1': '#F5F5F5',
        'light-2': '#E0E0E0',
      },
      boxShadow: {
        'glow-pink': '0 0 15px rgba(249, 24, 128, 0.5)',
        'glow-purple': '0 0 15px rgba(160, 32, 240, 0.5)',
        'glow-green': '0 0 15px rgba(74, 222, 128, 0.6)',
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.6)',
        'glow-yellow': '0 0 15px rgba(234, 179, 8, 0.6)',
        'glow-orange': '0 0 15px rgba(249, 115, 22, 0.6)',
        'glow-teal': '0 0 15px rgba(20, 184, 166, 0.6)',
      }
    },
  },
  plugins: [],
}