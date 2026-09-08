import { ThemeColorPreset } from '../types';

export const THEME_COLOR_PRESETS: ThemeColorPreset[] = [
  {
    id: 'pure-white',
    name: 'Pure White',
    hex: '#ffffff',
    description: 'Crisp, clean default canvas',
  },
  {
    id: 'warm-cream',
    name: 'Warm Cream',
    hex: '#fbf8f2',
    description: 'Gentle, soothing bookish tone',
  },
  {
    id: 'oatmeal',
    name: 'Oatmeal Linen',
    hex: '#f5efe6',
    description: 'Organic warm tactile neutral',
  },
  {
    id: 'vintage-parchment',
    name: 'Vintage Parchment',
    hex: '#f2ebd9',
    description: 'Classic antique aged paper',
  },
  {
    id: 'soft-sage',
    name: 'Soft Sage',
    hex: '#edf3ec',
    description: 'Calm botanical light tint',
  },
  {
    id: 'nordic-mist',
    name: 'Nordic Mist',
    hex: '#edf2f7',
    description: 'Cool airy architectural blue',
  },
  {
    id: 'lavender-dusk',
    name: 'Lavender Dusk',
    hex: '#f3eff9',
    description: 'Delicate contemplative lilac',
  },
  {
    id: 'blush-rose',
    name: 'Blush Rose',
    hex: '#faf0f2',
    description: 'Soft warm petal tone',
  },
  {
    id: 'pale-butter',
    name: 'Pale Butter',
    hex: '#fcf6e8',
    description: 'Subtle sunny warm ivory',
  },
  {
    id: 'cool-stone',
    name: 'Cool Stone',
    hex: '#e9eaeb',
    description: 'Crisp minimal industrial gray',
  },
  {
    id: 'warm-charcoal',
    name: 'Warm Charcoal',
    hex: '#1e2124',
    description: 'Dim cozy studio graphite',
    dark: true,
  },
  {
    id: 'obsidian',
    name: 'Obsidian Black',
    hex: '#121314',
    description: 'Deep distraction-free dark',
    dark: true,
  },
];

export const DEFAULT_THEME_COLOR = '#ffffff';

/**
 * Calculates relative luminance (W3C formula) from a hex string.
 * Value range: 0 (black) to 1 (white).
 */
export function getLuminance(hex: string): number {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 3 && clean.length !== 6) return 1;

  let full = clean;
  if (clean.length === 3) {
    full = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }

  const r = parseInt(full.substring(0, 2), 16) / 255;
  const g = parseInt(full.substring(2, 4), 16) / 255;
  const b = parseInt(full.substring(4, 6), 16) / 255;

  const toLinear = (v: number) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);

  return toLinear(r) * 0.2126 + toLinear(g) * 0.7152 + toLinear(b) * 0.0722;
}

/**
 * Determines whether a color is considered dark (requiring light foreground text).
 */
export function isColorDark(hex: string): boolean {
  return getLuminance(hex) < 0.38;
}

/**
 * Validates a hex color code (#fff or #ffffff).
 */
export function isValidHex(hex: string): boolean {
  return /^#([0-9A-F]{3}){1,2}$/i.test(hex.trim());
}

/**
 * Normalizes input to 6-digit uppercase hex, e.g. "#fff" -> "#FFFFFF".
 */
export function normalizeHex(hex: string): string {
  let clean = hex.trim();
  if (!clean.startsWith('#')) {
    clean = `#${clean}`;
  }
  if (/^#[0-9A-F]{3}$/i.test(clean)) {
    return `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`.toUpperCase();
  }
  if (/^#[0-9A-F]{6}$/i.test(clean)) {
    return clean.toUpperCase();
  }
  return DEFAULT_THEME_COLOR;
}

/**
 * Directly applies CSS variables and attributes to document root.
 */
export function applyThemeColorToDOM(hex: string) {
  if (typeof document === 'undefined') return;

  const valid = isValidHex(hex) ? normalizeHex(hex) : DEFAULT_THEME_COLOR;
  const isDark = isColorDark(valid);
  const root = document.documentElement;

  root.style.setProperty('--theme-bg', valid);
  root.setAttribute('data-theme-tone', isDark ? 'dark' : 'light');

  if (isDark) {
    root.style.setProperty('--theme-text', '#f3f4f6');
    root.style.setProperty('--theme-text-muted', '#9ca3af');
    root.style.setProperty('--theme-border', 'rgba(255, 255, 255, 0.18)');
    root.style.setProperty('--theme-hover-overlay', 'rgba(255, 255, 255, 0.08)');
  } else {
    root.style.setProperty('--theme-text', '#171717');
    root.style.setProperty('--theme-text-muted', '#737373');
    root.style.setProperty('--theme-border', '#d4d4d4');
    root.style.setProperty('--theme-hover-overlay', 'rgba(0, 0, 0, 0.04)');
  }
}
