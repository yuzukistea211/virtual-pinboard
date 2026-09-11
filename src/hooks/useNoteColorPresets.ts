import { useState, useEffect, useCallback } from 'react';
import { NoteColorPreset } from '../types';
import { NOTE_COLOR_PRESETS } from '../constants';
import { normalizeHex, isValidHex, isColorDark } from '../utils/themePresets';

export const NOTE_COLOR_PRESETS_STORAGE_KEY = 'pinboard_note_color_presets_v1';
export const HIGHLIGHT_COLOR_STORAGE_KEY = 'pinboard_highlight_color_v1';
export const DEFAULT_HIGHLIGHT_COLOR = '#FEF08A';

export interface HighlightColorPreset {
  id: string;
  name: string;
  hex: string;
}

export const HIGHLIGHT_COLOR_PRESETS: HighlightColorPreset[] = [
  { id: 'canary', name: 'Canary Yellow', hex: '#FEF08A' },
  { id: 'lemon', name: 'Electric Lemon', hex: '#FDE047' },
  { id: 'lime', name: 'Pastel Lime', hex: '#BBF7D0' },
  { id: 'mint', name: 'Mint Foam', hex: '#A7F3D0' },
  { id: 'sky', name: 'Sky Cyan', hex: '#BAE6FD' },
  { id: 'lavender', name: 'Soft Lavender', hex: '#E9D5FF' },
  { id: 'pink', name: 'Rose Blossom', hex: '#FBCFE8' },
  { id: 'peach', name: 'Warm Peach', hex: '#FED7AA' },
  { id: 'amber', name: 'Coral Amber', hex: '#FDBA74' },
  { id: 'slate', name: 'Slate Dusk', hex: '#64748B' },
];

export function useNoteColorPresets() {
  const [presets, setPresets] = useState<NoteColorPreset[]>(() => {
    if (typeof window === 'undefined') return NOTE_COLOR_PRESETS;
    try {
      const stored = localStorage.getItem(NOTE_COLOR_PRESETS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p) => {
            const hex = isValidHex(p.hex) ? normalizeHex(p.hex) : '#FFFFFF';
            return {
              id: p.id || `color_${Math.random().toString(36).substring(2, 9)}`,
              name: (p.name && p.name.trim()) || 'Color',
              hex,
              isDark: isColorDark(hex),
            };
          });
        }
      }
    } catch (e) {
      console.warn('Failed to parse note color presets from localStorage:', e);
    }
    return NOTE_COLOR_PRESETS;
  });

  // Highlight color state for markdown ==text==
  const [highlightColor, setHighlightColorState] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_HIGHLIGHT_COLOR;
    try {
      const stored = localStorage.getItem(HIGHLIGHT_COLOR_STORAGE_KEY);
      if (stored && isValidHex(stored)) {
        return normalizeHex(stored);
      }
    } catch (e) {
      console.warn('Failed to parse highlight color from localStorage:', e);
    }
    return DEFAULT_HIGHLIGHT_COLOR;
  });

  // Persist presets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(NOTE_COLOR_PRESETS_STORAGE_KEY, JSON.stringify(presets));
    } catch (e) {
      console.warn('Failed to store note color presets:', e);
    }
  }, [presets]);

  // Persist highlight color & sync CSS variables
  useEffect(() => {
    try {
      localStorage.setItem(HIGHLIGHT_COLOR_STORAGE_KEY, highlightColor);
    } catch (e) {
      console.warn('Failed to store highlight color:', e);
    }

    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--note-highlight-color', highlightColor);
      const isDark = isColorDark(highlightColor);
      root.style.setProperty('--note-highlight-text', isDark ? '#ffffff' : '#1e293b');
    }
  }, [highlightColor]);

  const updatePreset = useCallback((id: string, updates: { name?: string; hex?: string }) => {
    setPresets((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newHex = updates.hex && isValidHex(updates.hex) ? normalizeHex(updates.hex) : p.hex;
        const newName = updates.name !== undefined ? updates.name.trim() || 'Untitled' : p.name;
        return {
          ...p,
          name: newName,
          hex: newHex,
          isDark: isColorDark(newHex),
        };
      })
    );
  }, []);

  const addPreset = useCallback((newPreset: { name?: string; hex: string }) => {
    const validHex = isValidHex(newPreset.hex) ? normalizeHex(newPreset.hex) : '#FEF08A';
    const entry: NoteColorPreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: (newPreset.name && newPreset.name.trim()) || 'New Color',
      hex: validHex,
      isDark: isColorDark(validHex),
    };
    setPresets((prev) => [...prev, entry]);
    return entry;
  }, []);

  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => {
      if (prev.length <= 1) return prev; // Maintain at least one preset
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const setHighlightColor = useCallback((color: string) => {
    if (isValidHex(color)) {
      setHighlightColorState(normalizeHex(color));
    } else {
      setHighlightColorState(color);
    }
  }, []);

  const resetHighlightColor = useCallback(() => {
    setHighlightColorState(DEFAULT_HIGHLIGHT_COLOR);
  }, []);

  const resetToDefaults = useCallback(() => {
    setPresets(NOTE_COLOR_PRESETS);
    setHighlightColorState(DEFAULT_HIGHLIGHT_COLOR);
  }, []);

  return {
    presets,
    highlightColor,
    setHighlightColor,
    resetHighlightColor,
    highlightPresets: HIGHLIGHT_COLOR_PRESETS,
    updatePreset,
    addPreset,
    deletePreset,
    resetToDefaults,
  };
}
