/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Broto design tokens ──────────────────────────────────
        bg:              '#0E1410',
        surface:         '#161E18',
        'surface-hi':    '#1C261F',
        'surface-lo':    '#0B100D',
        primary:         '#7FE0A0',
        'primary-deep':  '#3FA968',
        'primary-ink':   '#0B1A11',
        amber:           '#E8B86A',
        blue:            '#8FB7E6',
        rose:            '#E68A8A',
        terracotta:      '#D8997A',

        // ── Legacy aliases (existing pages reuse these) ──────────
        // Maps old color names → Broto equivalents
        'on-surface':                 '#F1F4F0',
        'surface-container-highest':  '#1C261F',
        'surface-container-high':     '#1C261F',
        'surface-container-low':      '#0B100D',
        'surface-bright':             '#232E25',
        secondary:                    'rgba(241,244,240,0.62)',
        'secondary-container':        'rgba(127,224,160,0.14)',
        tertiary:                     '#E8B86A',
        'tertiary-container':         '#8FB7E6',
        'outline-variant':            'rgba(255,255,255,0.08)',
        error:                        '#E68A8A',
        'error-container':            'rgba(230,138,138,0.14)',
        'primary-container':          '#3FA968',
      },
      fontFamily: {
        sans:     ['"Geist"', '-apple-system', 'system-ui', 'sans-serif'],
        headline: ['"Geist"', '-apple-system', 'system-ui', 'sans-serif'],
        body:     ['"Geist"', '-apple-system', 'system-ui', 'sans-serif'],
        label:    ['"Geist"', '-apple-system', 'system-ui', 'sans-serif'],
        mono:     ['"Geist Mono"', 'ui-monospace', '"SF Mono"', 'monospace'],
      },
      borderRadius: {
        card:     '28px',
        'card-sm':'20px',
        input:    '16px',
      },
      boxShadow: {
        fab: '0 8px 24px rgba(127,224,160,0.35), 0 2px 6px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
}
