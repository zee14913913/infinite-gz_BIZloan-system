import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        sans:  ['var(--font-inter)', 'Avenir Next', 'Avenir', '-apple-system', 'system-ui', 'sans-serif'],
      },
      colors: {
        'bg-base':      'var(--color-bg-base)',
        'bg-surface':   'var(--color-bg-surface)',
        'bg-subtle':    'var(--color-bg-subtle)',
        'bg-muted':     'var(--color-bg-muted)',
        'bg-header':    'var(--color-bg-header)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary':'var(--color-text-secondary)',
        'text-muted':   'var(--color-text-muted)',
        'accent':       'var(--color-accent-gold)',
        'accent-hover': 'var(--color-accent-hover)',
        'credit':       'var(--color-credit)',
        'debit':        'var(--color-debit)',
        'border-light': 'var(--color-border-light)',
        'border-medium':'var(--color-border-medium)',
        'status-done':  'var(--color-status-done)',
        'status-pending':'var(--color-status-pending)',
        'status-alert': 'var(--color-status-alert)',
        'status-neutral':'var(--color-status-neutral)',
      },
      borderRadius: {
        'sm':   'var(--radius-sm)',
        'md':   'var(--radius-md)',
        'lg':   'var(--radius-lg)',
        'stat': 'var(--radius-stat)',
        'full': 'var(--radius-full)',
      },
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
}

export default config
