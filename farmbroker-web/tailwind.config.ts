import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: '#f2f8f1',
          100: '#dcefd9',
          200: '#b9ddb4',
          300: '#8ac382',
          400: '#5fa864',
          500: '#3f8c49',
          600: '#2f7039',
          700: '#285a31',
          800: '#23482b',
          900: '#1d3c25',
        },
        soil: {
          50: '#fbf7ef',
          100: '#f4ead2',
          300: '#dfbd79',
          500: '#bd8838',
          700: '#7f5429',
        },
        skyfarm: {
          50: '#eef8fb',
          200: '#bee6ef',
          500: '#46a9c1',
        },
        ink: {
          700: '#314035',
          900: '#102016',
        },
      },
      borderRadius: {
        app: '0.5rem',
      },
      boxShadow: {
        card: '0 12px 32px -24px rgba(16, 32, 22, 0.45)',
        lift: '0 18px 40px -26px rgba(16, 32, 22, 0.55)',
      },
      fontFamily: {
        sans: ['Inter', 'Pretendard', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
