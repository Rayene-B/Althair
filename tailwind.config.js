/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      opacity: {
        4: '0.04',
        6: '0.06',
        7: '0.07',
        8: '0.08',
        12: '0.12',
        14: '0.14',
        15: '0.15',
        18: '0.18',
        28: '0.28',
        35: '0.35',
        45: '0.45',
        48: '0.48',
        55: '0.55',
        58: '0.58',
        62: '0.62',
        64: '0.64',
        65: '0.65',
        68: '0.68',
        82: '0.82',
        88: '0.88',
        92: '0.92',
      },
      colors: {
        void: '#07051a',
        orbit: '#15113c',
        panel: '#211b50',
        panelSoft: '#302a68',
        nebula: '#51479c',
        ion: '#62d7ff',
        starlight: '#f8f7ff',
      },
      boxShadow: {
        glow: '0 0 30px rgba(98, 215, 255, 0.12)',
        card: '0 18px 45px rgba(0, 0, 0, 0.28)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
