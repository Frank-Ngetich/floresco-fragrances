import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: '#17140F',
          50:  '#F7F0DE',
          100: '#EEE0BC',
          200: '#DEC386',
          300: '#C9A455',
          400: '#AD8640',
          500: '#8A6D2E',
          600: '#17140F',
          700: '#0F0D0A',
          800: '#000000',
          900: '#000000',
        },
        cream: {
          DEFAULT: '#F5F1EA',
          50:  '#FDFCF9',
          100: '#FAFAF7',
          200: '#F5F1EA',
          300: '#EDE9E1',
          400: '#E4DDD3',
          500: '#D5CFC3',
          600: '#B8B0A3',
          700: '#9A9183',
          800: '#6B6660',
          900: '#3D3A36',
        },
        stone: {
          DEFAULT: '#0F0E0D',
          50:  '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
          950: '#0F0E0D',
        },
        wine: {
          DEFAULT: '#17140F',
          50:  '#F7F0DE',
          100: '#EEE0BC',
          200: '#DEC386',
          300: '#C9A455',
          400: '#AD8640',
          500: '#8A6D2E',
          600: '#17140F',
          700: '#0F0D0A',
          800: '#000000',
          900: '#000000',
        },
        gold: {
          DEFAULT: '#B5924C',
          50:  '#FBF8F0',
          100: '#F5EEDC',
          200: '#E9D9B0',
          300: '#D9BB6A',
          400: '#C9A455',
          500: '#B5924C',
          600: '#9C7C3F',
          700: '#7D6332',
          800: '#5E4A24',
          900: '#3D2F17',
        },
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'marquee': 'marquee 40s linear infinite',
        'fade-up': 'fadeUp 0.7s ease forwards',
        'orbit': 'orbit 60s linear infinite',
        'orbit-slow': 'orbit 90s linear infinite reverse',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(-1deg)' },
          '50%': { transform: 'translateY(-20px) rotate(1deg)' },
        },
        marquee: {
          to: { transform: 'translateX(-50%)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        orbit: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': '#2A2723',
            '--tw-prose-headings': '#0F0E0D',
            '--tw-prose-links': '#17140F',
            fontFamily: 'var(--font-cormorant), Georgia, serif',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
