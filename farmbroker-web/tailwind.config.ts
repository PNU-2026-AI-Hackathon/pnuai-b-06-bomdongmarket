import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          subtle: 'rgb(var(--color-surface-subtle) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--color-line) / <alpha-value>)',
          strong: 'rgb(var(--color-line-strong) / <alpha-value>)',
        },
        content: {
          DEFAULT: 'rgb(var(--color-content) / <alpha-value>)',
          muted: 'rgb(var(--color-content-muted) / <alpha-value>)',
          subtle: 'rgb(var(--color-content-subtle) / <alpha-value>)',
          inverse: 'rgb(var(--color-content-inverse) / <alpha-value>)',
        },
        action: {
          DEFAULT: 'rgb(var(--color-action) / <alpha-value>)',
          hover: 'rgb(var(--color-action-hover) / <alpha-value>)',
          soft: 'rgb(var(--color-action-soft) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          soft: 'rgb(var(--color-accent-soft) / <alpha-value>)',
        },
        feedback: {
          danger: 'rgb(var(--color-danger) / <alpha-value>)',
          'danger-soft': 'rgb(var(--color-danger-soft) / <alpha-value>)',
          success: 'rgb(var(--color-success) / <alpha-value>)',
          'success-soft': 'rgb(var(--color-success-soft) / <alpha-value>)',
        },
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
      spacing: {
        control: '2.75rem',
        'control-lg': '3rem',
      },
      boxShadow: {
        card: '0 12px 32px -24px rgba(16, 32, 22, 0.45)',
        lift: '0 18px 40px -26px rgba(16, 32, 22, 0.55)',
      },
      fontFamily: {
        sans: ['Inter', 'Pretendard', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        eyebrow: [
          '0.875rem',
          { fontWeight: '600', letterSpacing: '0.16em', lineHeight: '1.25rem' },
        ],
        'page-title': ['1.875rem', { fontWeight: '900', lineHeight: '2.25rem' }],
        'page-title-lg': ['2.25rem', { fontWeight: '900', lineHeight: '2.5rem' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5rem' }],
      },
      transitionDuration: {
        ui: '150ms',
      },
    },
  },
  plugins: [],
};

export default config;
