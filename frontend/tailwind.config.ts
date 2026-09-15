import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          'primary-hover': 'var(--brand-primary-hover)',
          tint: 'var(--brand-tint)',
        },
        bg: {
          page: 'var(--bg-page)',
          surface: 'var(--bg-surface)',
        },
        text: {
          primary: 'var(--text-primary)',
          muted: 'var(--text-muted)',
        },
        border: 'var(--border)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '8px',
        md: '8px',
        sm: '8px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        h1: ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        h2: ['22px', { lineHeight: '1.35', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        label: ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        body: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        small: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
      },
    },
  },
  plugins: [],
};

export default config;
