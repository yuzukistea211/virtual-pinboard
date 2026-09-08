import { FontOption } from '../types';

export const PRESET_FONTS: FontOption[] = [
  {
    id: 'system-sans',
    name: 'Modern Sans (System)',
    category: 'sans',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    sourceType: 'preset',
  },
  {
    id: 'serif-classic',
    name: 'Classic Serif (Georgia)',
    category: 'serif',
    fontFamily: 'Georgia, "Times New Roman", Cambria, serif',
    sourceType: 'preset',
  },
  {
    id: 'mono-clean',
    name: 'Minimal Monospace',
    category: 'mono',
    fontFamily: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, "Courier New", monospace',
    sourceType: 'preset',
  },
  {
    id: 'handwriting-caveat',
    name: 'Handwritten (Caveat)',
    category: 'handwriting',
    fontFamily: '"Caveat", "Comic Sans MS", "Bradley Hand", cursive',
    sourceType: 'web',
    webUrl: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&display=swap',
  },
  {
    id: 'inter-grotesk',
    name: 'Inter Grotesk',
    category: 'sans',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    sourceType: 'web',
    webUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
  {
    id: 'playfair-editorial',
    name: 'Playfair Display',
    category: 'serif',
    fontFamily: '"Playfair Display", Georgia, serif',
    sourceType: 'web',
    webUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..700;1,400..700&display=swap',
  },
  {
    id: 'dyslexic-verdana',
    name: 'High Readability (Verdana)',
    category: 'sans',
    fontFamily: 'Verdana, Tahoma, Geneva, sans-serif',
    sourceType: 'preset',
  },
];

export const POPULAR_GOOGLE_FONTS_SUGGESTIONS = [
  { name: 'Lora', category: 'Serif' },
  { name: 'Poppins', category: 'Geometric Sans' },
  { name: 'Kalam', category: 'Handwriting' },
  { name: 'Space Mono', category: 'Monospace' },
  { name: 'Outfit', category: 'Modern Sans' },
  { name: 'Dancing Script', category: 'Cursive' },
  { name: 'Merriweather', category: 'Readability Serif' },
];

/**
 * Load external web font stylesheet into document head if not already loaded
 */
export function loadWebFontStylesheet(id: string, url: string): Promise<void> {
  return new Promise((resolve) => {
    const linkId = `web-font-${id}`;
    if (document.getElementById(linkId)) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = () => resolve();
    link.onerror = () => {
      console.warn(`Could not load web font stylesheet from ${url}`);
      resolve();
    };
    document.head.appendChild(link);
  });
}

/**
 * Register a local font face into the document via the FontFace API
 */
export async function registerLocalFontFace(family: string, dataUrl: string): Promise<boolean> {
  try {
    const fontFace = new FontFace(family, `url(${dataUrl})`);
    const loaded = await fontFace.load();
    document.fonts.add(loaded);
    return true;
  } catch (err) {
    console.warn(`Failed to register FontFace for ${family}:`, err);
    return false;
  }
}

/**
 * Construct Google Fonts CSS URL from a font name
 */
export function buildGoogleFontUrl(fontName: string): string {
  const formatted = fontName.trim().replace(/\s+/g, '+');
  return `https://fonts.googleapis.com/css2?family=${formatted}:ital,wght@0,300..800;1,300..800&display=swap`;
}
