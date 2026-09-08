import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DEFAULT_THEME_COLOR,
  THEME_COLOR_PRESETS,
  applyThemeColorToDOM,
  isColorDark,
  isValidHex,
  normalizeHex,
} from '../utils/themePresets';
import { ThemeColorPreset } from '../types';

const STORAGE_KEY = 'pinboard_theme_color';

export function useThemeSettings() {
  const [themeColor, setThemeColorState] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME_COLOR;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isValidHex(saved)) {
        return normalizeHex(saved);
      }
    } catch {
      // ignore
    }
    return DEFAULT_THEME_COLOR;
  });

  // Apply theme to DOM on mount and whenever themeColor changes
  useEffect(() => {
    applyThemeColorToDOM(themeColor);
    try {
      localStorage.setItem(STORAGE_KEY, themeColor);
    } catch {
      // ignore
    }
  }, [themeColor]);

  const setThemeColor = useCallback((color: string) => {
    const normalized = isValidHex(color) ? normalizeHex(color) : color;
    setThemeColorState(normalized);
  }, []);

  const resetThemeColor = useCallback(() => {
    setThemeColorState(DEFAULT_THEME_COLOR);
  }, []);

  const isDark = useMemo(() => isColorDark(themeColor), [themeColor]);

  const activePreset = useMemo<ThemeColorPreset | undefined>(() => {
    const currentNorm = normalizeHex(themeColor);
    return THEME_COLOR_PRESETS.find((p) => normalizeHex(p.hex) === currentNorm);
  }, [themeColor]);

  return {
    themeColor,
    setThemeColor,
    resetThemeColor,
    isDark,
    activePreset,
    presets: THEME_COLOR_PRESETS,
  };
}
