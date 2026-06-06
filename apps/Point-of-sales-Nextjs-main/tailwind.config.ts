/** @type {import('tailwindcss').Config} */

const defaultTheme = require('tailwindcss/defaultTheme');

const svgToDataUri = require('mini-svg-data-uri');

const colors = require('tailwindcss/colors');
const {
  default: flattenColorPalette,
} = require('tailwindcss/lib/util/flattenColorPalette');

module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        chartbody: '#0F0F0F',
        bodydark1: '#DEE4EE',
        body: '#64748B',
        bodydark: '#AEB7C0',
        gr: '#EFF4FB',
        transparent: 'transparent',
        de: '0px 8px 13px -3px rgba(0, 0, 0, 0.07)',
        ca: 'rgba(0, 0, 0, 0.12)',
        whiter: '#F5F7FD',
        strokedark: '#2E3A47',
        stroke: '#E2E8F0',
        primarychart: '#3C50E0',
        secondarychart: '#80CAEE',
        'meta-4': '#313D4A',
        boxdark: '#24303F',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        white: 'hsl(var(--white) / <alpha-value>)',
        black: 'hsl(var(--black) / <alpha-value>)',
        neutral: {
          50: 'hsl(var(--neutral-50) / <alpha-value>)',
          100: 'hsl(var(--neutral-100) / <alpha-value>)',
          200: 'hsl(var(--neutral-200) / <alpha-value>)',
          300: 'hsl(var(--neutral-300) / <alpha-value>)',
          400: 'hsl(var(--neutral-400) / <alpha-value>)',
          500: 'hsl(var(--neutral-500) / <alpha-value>)',
          600: 'hsl(var(--neutral-600) / <alpha-value>)',
          700: 'hsl(var(--neutral-700) / <alpha-value>)',
          800: 'hsl(var(--neutral-800) / <alpha-value>)',
          900: 'hsl(var(--neutral-900) / <alpha-value>)',
          950: 'hsl(var(--neutral-950) / <alpha-value>)',
        },
        zinc: {
          50: 'hsl(var(--zinc-50) / <alpha-value>)',
          100: 'hsl(var(--zinc-100) / <alpha-value>)',
          200: 'hsl(var(--zinc-200) / <alpha-value>)',
          300: 'hsl(var(--zinc-300) / <alpha-value>)',
          400: 'hsl(var(--zinc-400) / <alpha-value>)',
          500: 'hsl(var(--zinc-500) / <alpha-value>)',
          600: 'hsl(var(--zinc-600) / <alpha-value>)',
          700: 'hsl(var(--zinc-700) / <alpha-value>)',
          800: 'hsl(var(--zinc-800) / <alpha-value>)',
          900: 'hsl(var(--zinc-900) / <alpha-value>)',
          950: 'hsl(var(--zinc-950) / <alpha-value>)',
        },
        slate: {
          50: 'hsl(var(--slate-50) / <alpha-value>)',
          100: 'hsl(var(--slate-100) / <alpha-value>)',
          200: 'hsl(var(--slate-200) / <alpha-value>)',
          300: 'hsl(var(--slate-300) / <alpha-value>)',
          400: 'hsl(var(--slate-400) / <alpha-value>)',
          500: 'hsl(var(--slate-500) / <alpha-value>)',
          600: 'hsl(var(--slate-600) / <alpha-value>)',
          700: 'hsl(var(--slate-700) / <alpha-value>)',
          800: 'hsl(var(--slate-800) / <alpha-value>)',
          900: 'hsl(var(--slate-900) / <alpha-value>)',
          950: 'hsl(var(--slate-950) / <alpha-value>)',
        },
        gray: {
          50: 'hsl(var(--gray-50) / <alpha-value>)',
          100: 'hsl(var(--gray-100) / <alpha-value>)',
          200: 'hsl(var(--gray-200) / <alpha-value>)',
          300: 'hsl(var(--gray-300) / <alpha-value>)',
          400: 'hsl(var(--gray-400) / <alpha-value>)',
          500: 'hsl(var(--gray-500) / <alpha-value>)',
          600: 'hsl(var(--gray-600) / <alpha-value>)',
          700: 'hsl(var(--gray-700) / <alpha-value>)',
          800: 'hsl(var(--gray-800) / <alpha-value>)',
          900: 'hsl(var(--gray-900) / <alpha-value>)',
          950: 'hsl(var(--gray-950) / <alpha-value>)',
        },
        blue: {
          50: 'hsl(var(--blue-50) / <alpha-value>)',
          100: 'hsl(var(--blue-100) / <alpha-value>)',
          200: 'hsl(var(--blue-200) / <alpha-value>)',
          300: 'hsl(var(--blue-300) / <alpha-value>)',
          400: 'hsl(var(--blue-400) / <alpha-value>)',
          500: 'hsl(var(--blue-500) / <alpha-value>)',
          600: 'hsl(var(--blue-600) / <alpha-value>)',
          700: 'hsl(var(--blue-700) / <alpha-value>)',
          800: 'hsl(var(--blue-800) / <alpha-value>)',
          900: 'hsl(var(--blue-900) / <alpha-value>)',
          950: 'hsl(var(--blue-950) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        metallic: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 1.5s infinite',
        metallic: 'metallic 1.5s infinite',
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['dark'],
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    addVariablesForColors,
    function ({ matchUtilities, theme }: any) {
      matchUtilities(
        {
          'bg-grid': (value: any) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          'bg-grid-small': (value: any) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="8" height="8" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          'bg-dot': (value: any) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none"><circle fill="${value}" id="pattern-circle" cx="10" cy="10" r="1.6257413380501518"></circle></svg>`
            )}")`,
          }),
        },
        { values: flattenColorPalette(theme('backgroundColor')), type: 'color' }
      );
    },
  ],
};

function addVariablesForColors({ addBase, theme }: any) {
  let allColors = flattenColorPalette(theme('colors'));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ':root': newVars,
  });
}
