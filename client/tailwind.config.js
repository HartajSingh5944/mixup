/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        coral: '#f9735b',
        mint: '#2dd4bf',
      },
      boxShadow: {
        soft: '0 18px 45px rgba(17, 24, 39, 0.12)',
      },
    },
  },
  plugins: [],
};

