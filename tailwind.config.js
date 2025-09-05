/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // Ensure Tailwind scans for theme classes
    './src/contexts/ThemeContext.tsx',
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};
