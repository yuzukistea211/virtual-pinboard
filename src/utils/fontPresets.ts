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
    // Check if an existing link already loads this exact URL
    const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(
      (el) => (el as HTMLLinkElement).href === url
    );
    if (existing) {
      resolve();
      return;
    }

    const linkId = `web-font-${id}`;
    const byId = document.getElementById(linkId);
    if (byId) {
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
 * Extract clean single font family name without quotes or fallbacks for FontFace API
 */
export function extractCleanFamily(family: string): string {
  if (!family) return 'CustomFont';
  // Take first family before any comma fallback
  const first = family.split(',')[0].trim();
  // Strip surrounding quotes
  return first.replace(/^["']|["']$/g, '').trim() || 'CustomFont';
}

/**
 * Register a local font face into the document via both CSS @font-face and the FontFace API
 */
export async function registerLocalFontFace(family: string, dataUrl: string): Promise<boolean> {
  const cleanFamily = extractCleanFamily(family);
  if (!cleanFamily || !dataUrl) return false;

  // 1. Inject @font-face stylesheet directly into DOM for immediate, reliable CSS matching
  const safeId = cleanFamily.replace(/[^a-zA-Z0-9_-]/g, '_');
  const styleId = `local-font-face-style-${safeId}`;
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `@font-face { font-family: "${cleanFamily}"; src: url("${dataUrl}"); font-display: swap; }`;

  // 2. Also register into document.fonts using the FontFace API for programmatic canvas/DOM measurement
  try {
    // Check if already registered
    const existing = Array.from(document.fonts).find(
      (f) => extractCleanFamily(f.family) === cleanFamily && f.status === 'loaded'
    );
    if (existing) {
      return true;
    }

    let fontFace: FontFace;
    // Decode base64 to ArrayBuffer when possible for maximum sandbox/iframe compatibility
    if (dataUrl.startsWith('data:')) {
      try {
        const parts = dataUrl.split(',');
        if (parts.length > 1) {
          const binaryStr = atob(parts[1]);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          fontFace = new FontFace(cleanFamily, bytes.buffer);
        } else {
          fontFace = new FontFace(cleanFamily, `url(${dataUrl})`);
        }
      } catch {
        fontFace = new FontFace(cleanFamily, `url(${dataUrl})`);
      }
    } else {
      fontFace = new FontFace(cleanFamily, `url(${dataUrl})`);
    }

    const loaded = await fontFace.load();
    document.fonts.add(loaded);
    try {
      await document.fonts.ready;
    } catch {
      // safe fallback
    }
    return true;
  } catch (err) {
    console.warn(`FontFace API warning for ${cleanFamily} (DOM @font-face is active):`, err);
    return true; // Still return true because DOM style rule is already active!
  }
}

/**
 * Construct Google Fonts CSS URL from a font name
 */
export function buildGoogleFontUrl(fontName: string): string {
  const formatted = fontName.trim().replace(/\s+/g, '+');
  return `https://fonts.googleapis.com/css2?family=${formatted}:ital,wght@0,300..800;1,300..800&display=swap`;
}

export interface ExtractedFontInput {
  type: 'css-url' | 'font-name';
  url?: string;
  name?: string;
}

/**
 * Cleanly extract a CSS stylesheet URL from user input, supporting:
 * - Direct URLs: https://...
 * - @import url("https://...");
 * - @import url('https://...');
 * - @import url(https://...);
 * - @import "https://...";
 * - <link rel="stylesheet" href="https://...">
 * - Font names (e.g. "Poppins", "Lora")
 */
export function extractWebFontInput(input: string): ExtractedFontInput {
  const trimmed = input.trim();

  // 1. <link ... href="..." ...> or <link ... href='...' ...>
  const linkMatch =
    trimmed.match(/<link[^>]+href=["'](https?:\/\/[^"'\s]+)["']/i) ||
    trimmed.match(/href=["'](https?:\/\/[^"'\s]+)["']/i);
  if (linkMatch) {
    return { type: 'css-url', url: linkMatch[1] };
  }

  // 2. @import url("...") or @import '...' or @import url(...) or @import "..."
  const importMatch = trimmed.match(
    /@import\s+(?:url\(\s*["']?|["'])(https?:\/\/[^"'\)\s]+)["']?\s*\)?/i
  );
  if (importMatch) {
    return { type: 'css-url', url: importMatch[1] };
  }

  // 3. Standalone url("...")
  const urlFuncMatch = trimmed.match(/url\(\s*["']?(https?:\/\/[^"'\)\s]+)["']?\s*\)/i);
  if (urlFuncMatch) {
    return { type: 'css-url', url: urlFuncMatch[1] };
  }

  // 4. Starts with http:// or https://
  if (/^https?:\/\//i.test(trimmed)) {
    const cleanUrl = trimmed.replace(/[;"'\s]+$/, '').replace(/^["']+/, '');
    return { type: 'css-url', url: cleanUrl };
  }

  // 5. Plain font name
  return { type: 'font-name', name: trimmed };
}

export interface DetectedFontInfo {
  webUrl: string;
  fontFamily: string; // The exact font-family name for CSS @font-face matching (e.g. "BabelStone Han")
  displayName: string; // The human-friendly label for the UI
}

/**
 * Detect the real font-family and display name from any CSS URL (ZeoSeven, Google Fonts, CDN)
 * or font name, resolving CSS contents and font metadata.
 */
export async function detectFontDetails(
  input: string,
  customLabel?: string
): Promise<DetectedFontInfo> {
  const extracted = extractWebFontInput(input);
  let webUrl = '';
  let detectedFamily: string | null = null;
  const userDisplayName = customLabel?.trim() || '';

  if (extracted.type === 'font-name') {
    const fontName = extracted.name || 'Custom Font';
    detectedFamily = fontName;
    webUrl = buildGoogleFontUrl(fontName);
  } else if (extracted.type === 'css-url' && extracted.url) {
    webUrl = extracted.url;

    // A. Check if Google Fonts URL format (family=FontName:wght@...)
    try {
      const parsed = new URL(webUrl);
      const familyParam = parsed.searchParams.get('family');
      if (familyParam) {
        const name = familyParam.split(':')[0].replace(/\+/g, ' ').trim();
        if (name) {
          detectedFamily = name;
        }
      }
    } catch {
      // ignore
    }

    // B. Fetch CSS text directly (ZeoSeven, Google Fonts, jsDelivr, unpkg all support CORS)
    if (!detectedFamily) {
      try {
        const resp = await fetch(webUrl);
        if (resp.ok) {
          const cssText = await resp.text();

          // 1. Check for comment metadata: FontFamilyName / FullFontName (common in ZeoSeven, cn-font-split)
          const commentMatch = cssText.match(/(?:FontFamilyName|FullFontName)\s*[:\s]\s*([^\r\n*\/]+)/i);
          if (commentMatch && commentMatch[1]) {
            const commentName = commentMatch[1].trim();
            if (commentName) {
              detectedFamily = commentName;
            }
          }

          // 2. Search for font-family: "..." inside CSS / @font-face rules
          if (!detectedFamily) {
            const fontMatches = Array.from(
              cssText.matchAll(/font-family\s*:\s*["']?([^"';}{]+)["']?/gi)
            );
            for (const match of fontMatches) {
              const cand = match[1]?.trim();
              if (
                cand &&
                !['inherit', 'initial', 'sans-serif', 'serif', 'monospace', 'cursive'].includes(
                  cand.toLowerCase()
                )
              ) {
                detectedFamily = cand;
                break;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Direct CSS fetch was not accessible via CORS or offline:', err);
      }
    }

    // C. Inspect document.fonts before and after loading the stylesheet
    if (!detectedFamily && typeof document !== 'undefined' && document.fonts) {
      const beforeFamilies = new Set(
        Array.from(document.fonts).map((f) => f.family.replace(/['"]/g, '').trim())
      );

      await loadWebFontStylesheet(`temp_detect_${Date.now()}`, webUrl);
      try {
        await document.fonts.ready;
      } catch {
        // ignore
      }

      const afterFamilies = Array.from(document.fonts).map((f) =>
        f.family.replace(/['"]/g, '').trim()
      );
      const newlyAdded = afterFamilies.find((f) => f && !beforeFamilies.has(f));
      if (newlyAdded) {
        detectedFamily = newlyAdded;
      }
    }

    // D. URL pathname heuristics (e.g. /fonts/SmileySans.css or /SmileySans/result.css)
    if (!detectedFamily) {
      try {
        const urlObj = new URL(webUrl);
        const segments = urlObj.pathname.split('/').filter(Boolean);
        const lastPart = segments[segments.length - 1] || '';
        const nameNoExt = lastPart.replace(/\.css$/i, '');
        if (
          nameNoExt &&
          !['result', 'index', 'style', 'font', 'main'].includes(nameNoExt.toLowerCase())
        ) {
          detectedFamily = nameNoExt.replace(/[-_]/g, ' ');
        } else if (segments.length > 1) {
          const parentSeg = segments[segments.length - 2];
          if (
            parentSeg &&
            !['css', 'main', 'dist', 'build', 'v1', 'v2', 'v3'].includes(parentSeg.toLowerCase())
          ) {
            detectedFamily = parentSeg.replace(/[-_]/g, ' ');
          }
        }
      } catch {
        // ignore
      }
    }
  }

  const finalFamily = detectedFamily || userDisplayName || 'Custom Web Font';
  const finalDisplayName = userDisplayName || detectedFamily || finalFamily;

  return {
    webUrl,
    fontFamily: finalFamily,
    displayName: finalDisplayName,
  };
}
