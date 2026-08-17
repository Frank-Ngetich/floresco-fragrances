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
          DEFAULT: '#722F37',
          50:  '#FBF4F5',
          100: '#F5E6E8',
          200: '#E9C6CA',
          300: '#D99AA0',
          400: '#C46E76',
          500: '#AA4450',
          600: '#8B3A44',
          700: '#722F37',
          800: '#4E1F25',
          900: '#2A1013',
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
          DEFAULT: '#B02837',
          50:  '#FFF7F8',
          100: '#FDEBEE',
          200: '#F8D0D6',
          300: '#EAA7B0',
          400: '#D66E79',
          500: '#BA4650',
          600: '#B02837',
          700: '#821926',
          800: '#63141C',
          900: '#3D0C11',
        },
        gold: '#B5924C',
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
            '--tw-prose-links': '#722F37',
            fontFamily: 'var(--font-cormorant), Georgia, serif',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
