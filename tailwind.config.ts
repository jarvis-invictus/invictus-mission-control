import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fafff0',
          100: '#f0ffd1',
          200: '#e0ffa3',
          300: '#d1ff75',
          400: '#CCFF00',
          500: '#b8e600',
          600: '#a3cc00',
          700: '#8fb300',
          800: '#7a9900',
          900: '#668000',
        },
        surface: {
          0: '#000000',
          1: '#0a0a0f',
          2: '#111118',
          3: '#18181f',
          4: '#1f1f28',
          5: '#262630',
        },
        accent: {
          cyan: '#06B6D4',
          purple: '#D946EF',
          orange: '#F97316',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#06B6D4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
