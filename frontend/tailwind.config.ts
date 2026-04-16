import type { Config } from 'tailwindcss';

export default <Partial<Config>>{
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './plugins/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f6f8fb',
          100: '#e8edf5',
          200: '#d4deed',
          300: '#bfd0e7',
          600: '#2f5ea8',
          700: '#264f90',
          900: '#1a3259'
        }
      }
    }
  }
};
