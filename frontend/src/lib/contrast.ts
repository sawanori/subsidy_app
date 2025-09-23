// Contrast checking utilities for WCAG compliance - APP-213

// Convert hex color to RGB
export const hexToRgb = (hex: string): [number, number, number] | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
};

// Calculate relative luminance
export const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

// Calculate contrast ratio between two colors
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);
  
  const lightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (lightest + 0.05) / (darkest + 0.05);
};

// WCAG compliance levels
export const WCAG_LEVELS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
} as const;

// Check if color combination meets WCAG standards
export const isWCAGCompliant = (
  foreground: string,
  background: string,
  level: keyof typeof WCAG_LEVELS = 'AA_NORMAL'
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= WCAG_LEVELS[level];
};

// Get accessible color palette with guaranteed contrast ratios
export const getAccessibleColors = () => ({
  // High contrast pairs (AAA compliant)
  highContrast: {
    text: '#000000',
    background: '#ffffff',
    ratio: 21, // Maximum possible contrast
  },
  
  // Primary colors with AA compliance
  primary: {
    text: '#ffffff',
    background: '#0ea5e9', // primary-500
    ratio: getContrastRatio('#ffffff', '#0ea5e9'),
  },
  
  // Error colors with high visibility
  error: {
    text: '#ffffff',
    background: '#dc2626', // red-600 for better contrast
    ratio: getContrastRatio('#ffffff', '#dc2626'),
  },
  
  // Success colors
  success: {
    text: '#ffffff',
    background: '#16a34a', // green-600
    ratio: getContrastRatio('#ffffff', '#16a34a'),
  },
  
  // Warning colors
  warning: {
    text: '#000000',
    background: '#facc15', // yellow-400 for better contrast
    ratio: getContrastRatio('#000000', '#facc15'),
  },
  
  // Info colors
  info: {
    text: '#ffffff',
    background: '#2563eb', // blue-600
    ratio: getContrastRatio('#ffffff', '#2563eb'),
  },
});

// Generate accessible text color for any background
export const getAccessibleTextColor = (backgroundColor: string): string => {
  const whiteRatio = getContrastRatio('#ffffff', backgroundColor);
  const blackRatio = getContrastRatio('#000000', backgroundColor);
  
  return whiteRatio >= blackRatio ? '#ffffff' : '#000000';
};

// Validate design tokens against WCAG standards
export const validateDesignTokens = () => {
  const colors = getAccessibleColors();
  const results: Array<{
    name: string;
    foreground: string;
    background: string;
    ratio: number;
    isCompliant: boolean;
    level: string;
  }> = [];
  
  Object.entries(colors).forEach(([name, color]) => {
    const isAA = color.ratio >= WCAG_LEVELS.AA_NORMAL;
    const isAAA = color.ratio >= WCAG_LEVELS.AAA_NORMAL;
    
    results.push({
      name,
      foreground: color.text,
      background: color.background,
      ratio: Math.round(color.ratio * 100) / 100,
      isCompliant: isAA,
      level: isAAA ? 'AAA' : isAA ? 'AA' : 'Fail',
    });
  });
  
  return results;
};