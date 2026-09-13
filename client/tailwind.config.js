/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef4ff',
          100: '#dfe8ff',
          200: '#c3d4ff',
          300: '#9bb6ff',
          400: '#6d8fff',
          500: '#3d63f5',
          600: '#2c47e0',
          700: '#2436b5',
          800: '#212f8f',
          900: '#1f2b72',
        },
      },
    },
  },
  plugins: [],
};
