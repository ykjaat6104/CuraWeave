/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9f4',
          100: '#dcf1e5',
          200: '#bbe3cc',
          300: '#8ccead',
          400: '#57b285',
          500: '#2e9664',
          600: '#1e7a4f',
          700: '#186040',
          800: '#154d34',
          900: '#12402c',
        },
        slate: {
          950: '#020617',
        }
      },
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
