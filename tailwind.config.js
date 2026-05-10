/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#00c030',
          dark: '#14181c',
          darker: '#0c1014',
          card: '#1c2228',
          border: '#2c3440',
          muted: '#678',
          text: '#9ab',
        },
      },
    },
  },
  plugins: [],
}

