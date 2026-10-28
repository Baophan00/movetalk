/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg))',
        surface: 'hsl(var(--surface))',
        line: 'hsl(var(--line))',
        ink: 'hsl(var(--ink))',
        muted: 'hsl(var(--muted))',
        primary: { DEFAULT: 'hsl(var(--primary))', soft: 'hsl(var(--primary-soft))' },
        accent: 'hsl(var(--accent))',
        pink: 'hsl(var(--pink))',
        mint: 'hsl(var(--mint))',
        ok: 'hsl(var(--ok))',
        warn: 'hsl(var(--warn))',
        danger: 'hsl(var(--danger))',
      },
      borderRadius: { xl: '14px', '2xl': '18px', '3xl': '24px' },
      fontFamily: { sans: ['Inter', 'Be Vietnam Pro', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px -12px rgba(15,23,42,.12)',
        lift: '0 2px 4px rgba(15,23,42,.05), 0 18px 40px -18px rgba(15,23,42,.24)',
      },
      keyframes: {
        'fade-up': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: { 'fade-up': 'fade-up .32s cubic-bezier(.22,1,.36,1) both' },
    },
  },
  plugins: [],
}
