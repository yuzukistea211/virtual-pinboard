import { useState, useEffect, useCallback } from 'react';
import { NoteColorPreset } from '../types';
import { NOTE_COLOR_PRESETS } from '../constants';
import { normalizeHex, isValidHex, isColorDark } from '../utils/themePresets';

export const NOTE_COLOR_PRESETS_STORAGE_KEY = 'pinboard_note_color_presets_v1';

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

  // Persist to localStorage whenever presets change
  useEffect(() => {
    try {
      localStorage.setItem(NOTE_COLOR_PRESETS_STORAGE_KEY, JSON.stringify(presets));
    } catch (e) {
      console.warn('Failed to store note color presets:', e);
    }
  }, [presets]);

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

  const resetToDefaults = useCallback(() => {
    setPresets(NOTE_COLOR_PRESETS);
  }, []);

  return {
    presets,
    updatePreset,
    addPreset,
    deletePreset,
    resetToDefaults,
  };
}
