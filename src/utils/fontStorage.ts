import { CustomFontRecord, FontSettings } from '../types';

const DB_NAME = 'pinboard_fonts_db';
const DB_VERSION = 1;
const STORE_NAME = 'custom_fonts';
const LOCAL_STORAGE_FONTS_KEY = 'pinboard_custom_fonts_fallback_v1';
export const FONT_SETTINGS_STORAGE_KEY = 'pinboard_font_settings_v1';

export const DEFAULT_FONT_SETTINGS: FontSettings = {
  selectedFontId: 'system-sans',
  applyTo: 'all',
  sizeScale: 100,
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open font database'));
  });
}

/**
 * Retrieve all custom fonts from IndexedDB, merged with localStorage
 */
export async function getStoredCustomFonts(): Promise<CustomFontRecord[]> {
  const localFonts = getCustomFontsFromLocalStorage();
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const idbFonts = (request.result as CustomFontRecord[]) || [];
        // Merge by ID, preferring whichever has fileData
        const map = new Map<string, CustomFontRecord>();
        for (const f of localFonts) {
          map.set(f.id, f);
        }
        for (const f of idbFonts) {
          const existing = map.get(f.id);
          if (!existing || (!existing.fileData && f.fileData)) {
            map.set(f.id, f);
          }
        }
        resolve(Array.from(map.values()));
      };
      request.onerror = () => {
        resolve(localFonts);
      };
    });
  } catch {
    return localFonts;
  }
}

/**
 * Synchronous retrieval of cached custom fonts from localStorage
 */
export function getStoredCustomFontsSync(): CustomFontRecord[] {
  return getCustomFontsFromLocalStorage();
}

/**
 * Save a custom font record into persistent storage (IndexedDB + localStorage fallback)
 */
export async function saveStoredCustomFont(font: CustomFontRecord): Promise<void> {
  // Always mirror to localStorage for instantaneous synchronous access on reload
  saveCustomFontToLocalStorage(font);

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(font);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not store font in IndexedDB, saved to localStorage', err);
  }
}

/**
 * Delete a custom font by ID from storage
 */
export async function deleteStoredCustomFont(id: string): Promise<void> {
  deleteCustomFontFromLocalStorage(id);

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not delete font from IndexedDB', err);
  }
}

// LocalStorage fallbacks
function getCustomFontsFromLocalStorage(): CustomFontRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FONTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomFontToLocalStorage(font: CustomFontRecord): void {
  try {
    // Only mirror fonts with smaller payloads (< 1.5MB) to localStorage because localStorage is capped at ~5MB total
    // Larger font files are safely persisted in IndexedDB
    if (font.fileData && font.fileData.length > 1_500_000) {
      return;
    }
    const existing = getCustomFontsFromLocalStorage();
    const filtered = existing.filter((f) => f.id !== font.id);
    filtered.push(font);
    localStorage.setItem(LOCAL_STORAGE_FONTS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to save font to localStorage fallback', e);
  }
}

function deleteCustomFontFromLocalStorage(id: string): void {
  try {
    const existing = getCustomFontsFromLocalStorage();
    const filtered = existing.filter((f) => f.id !== id);
    localStorage.setItem(LOCAL_STORAGE_FONTS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to delete font from localStorage fallback', e);
  }
}

/**
 * Get active font settings from localStorage
 */
export function getStoredFontSettings(): FontSettings {
  try {
    const raw = localStorage.getItem(FONT_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_FONT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      selectedFontId: typeof parsed.selectedFontId === 'string' ? parsed.selectedFontId : DEFAULT_FONT_SETTINGS.selectedFontId,
      applyTo: parsed.applyTo === 'notes-only' ? 'notes-only' : 'all',
      sizeScale: typeof parsed.sizeScale === 'number' ? parsed.sizeScale : 100,
    };
  } catch {
    return DEFAULT_FONT_SETTINGS;
  }
}

/**
 * Save active font settings to localStorage
 */
export function saveStoredFontSettings(settings: FontSettings): void {
  try {
    localStorage.setItem(FONT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save font settings', e);
  }
}
