// Typography Design System - APP-203
// Designed for both screen and PDF output compatibility

export const fontFamilies = {
  sans: [
    'ui-sans-serif',
    'system-ui',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
    '"Noto Color Emoji"',
  ],
  mono: [
    'ui-monospace',
    'SFMono-Regular',
    '"Menlo"',
    '"Monaco"',
    '"Consolas"',
    '"Liberation Mono"',
    '"Courier New"',
    'monospace',
  ],
  // For PDF generation - web-safe fonts
  pdf: [
    '"Times New Roman"',
    'Times',
    'serif',
  ],
} as const;

export const fontSizes = {
  xs: {
    fontSize: '0.75rem',    // 12px
    lineHeight: '1rem',     // 16px
  },
  sm: {
    fontSize: '0.875rem',   // 14px
    lineHeight: '1.25rem',  // 20px
  },
  base: {
    fontSize: '1rem',       // 16px
    lineHeight: '1.5rem',   // 24px
  },
  lg: {
    fontSize: '1.125rem',   // 18px
    lineHeight: '1.75rem',  // 28px
  },
  xl: {
    fontSize: '1.25rem',    // 20px
    lineHeight: '1.75rem',  // 28px
  },
  '2xl': {
    fontSize: '1.5rem',     // 24px
    lineHeight: '2rem',     // 32px
  },
  '3xl': {
    fontSize: '1.875rem',   // 30px
    lineHeight: '2.25rem',  // 36px
  },
  '4xl': {
    fontSize: '2.25rem',    // 36px
    lineHeight: '2.5rem',   // 40px
  },
  '5xl': {
    fontSize: '3rem',       // 48px
    lineHeight: '1',
  },
  '6xl': {
    fontSize: '3.75rem',    // 60px
    lineHeight: '1',
  },
} as const;

export const fontWeights = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

// Semantic typography scale
export const typography = {
  // Display text
  'display-2xl': {
    ...fontSizes['6xl'],
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  'display-xl': {
    ...fontSizes['5xl'],
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  'display-lg': {
    ...fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  'display-md': {
    ...fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  'display-sm': {
    ...fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
  },
  'display-xs': {
    ...fontSizes.xl,
    fontWeight: fontWeights.semibold,
  },

  // Headings
  h1: {
    ...fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    ...fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    ...fontSizes.xl,
    fontWeight: fontWeights.semibold,
  },
  h4: {
    ...fontSizes.lg,
    fontWeight: fontWeights.medium,
  },
  h5: {
    ...fontSizes.base,
    fontWeight: fontWeights.medium,
  },
  h6: {
    ...fontSizes.sm,
    fontWeight: fontWeights.medium,
  },

  // Body text
  'text-xl': {
    ...fontSizes.xl,
    fontWeight: fontWeights.normal,
  },
  'text-lg': {
    ...fontSizes.lg,
    fontWeight: fontWeights.normal,
  },
  'text-md': {
    ...fontSizes.base,
    fontWeight: fontWeights.normal,
  },
  'text-sm': {
    ...fontSizes.sm,
    fontWeight: fontWeights.normal,
  },
  'text-xs': {
    ...fontSizes.xs,
    fontWeight: fontWeights.normal,
  },

  // Special text
  label: {
    ...fontSizes.sm,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wide,
  },
  caption: {
    ...fontSizes.xs,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacing.wide,
  },
  overline: {
    ...fontSizes.xs,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase' as const,
  },
} as const;

// PDF-specific typography for document generation
export const pdfTypography = {
  documentTitle: {
    fontSize: '18px',
    fontWeight: fontWeights.bold,
    lineHeight: '1.3',
    fontFamily: fontFamilies.pdf.join(', '),
    textAlign: 'center' as const,
  },
  sectionHeading: {
    fontSize: '14px',
    fontWeight: fontWeights.bold,
    lineHeight: '1.4',
    fontFamily: fontFamilies.pdf.join(', '),
    marginTop: '16px',
    marginBottom: '8px',
  },
  bodyText: {
    fontSize: '12px',
    fontWeight: fontWeights.normal,
    lineHeight: '1.6',
    fontFamily: fontFamilies.pdf.join(', '),
    marginBottom: '8px',
  },
  tableHeader: {
    fontSize: '11px',
    fontWeight: fontWeights.semibold,
    lineHeight: '1.4',
    fontFamily: fontFamilies.pdf.join(', '),
    textAlign: 'center' as const,
  },
  tableCell: {
    fontSize: '10px',
    fontWeight: fontWeights.normal,
    lineHeight: '1.4',
    fontFamily: fontFamilies.pdf.join(', '),
  },
  caption: {
    fontSize: '9px',
    fontWeight: fontWeights.normal,
    lineHeight: '1.3',
    fontFamily: fontFamilies.pdf.join(', '),
    fontStyle: 'italic' as const,
  },
} as const;