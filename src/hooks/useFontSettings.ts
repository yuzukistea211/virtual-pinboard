import { useState, useEffect, useCallback, useMemo } from 'react';
import { FontOption, FontSettings, CustomFontRecord, FontApplyScope } from '../types';
import {
  getStoredFontSettings,
  saveStoredFontSettings,
  getStoredCustomFonts,
  getStoredCustomFontsSync,
  saveStoredCustomFont,
  deleteStoredCustomFont,
  DEFAULT_FONT_SETTINGS,
} from '../utils/fontStorage';
import {
  PRESET_FONTS,
  loadWebFontStylesheet,
  registerLocalFontFace,
  buildGoogleFontUrl,
  detectFontDetails,
} from '../utils/fontPresets';

export function useFontSettings() {
  const [settings, setSettings] = useState<FontSettings>(() => getStoredFontSettings());
  const [customRecords, setCustomRecords] = useState<CustomFontRecord[]>(() => {
    const syncRecords = getStoredCustomFontsSync();
    if (typeof window !== 'undefined') {
      for (const record of syncRecords) {
        if (record.sourceType === 'file' && record.fileData) {
          registerLocalFontFace(record.fontFamily, record.fileData);
        } else if (record.sourceType === 'web' && record.webUrl) {
          loadWebFontStylesheet(record.id, record.webUrl);
        }
      }
    }
    return syncRecords;
  });
  const [isReady, setIsReady] = useState(false);

  // Load custom fonts on mount
  useEffect(() => {
    let mounted = true;

    async function initFonts() {
      // 1. Preload any web presets (e.g. Caveat, Inter, Playfair)
      for (const preset of PRESET_FONTS) {
        if (preset.webUrl) {
          loadWebFontStylesheet(preset.id, preset.webUrl);
        }
      }

      // 2. Load stored custom fonts (with auto-repair for web fonts if previously saved with generic name)
      try {
        const stored = await getStoredCustomFonts();
        if (!mounted) return;

        // Auto-repair records that were previously saved with generic 'Web Font'
        const repaired = await Promise.all(
          stored.map(async (record) => {
            if (
              record.sourceType === 'web' &&
              record.webUrl &&
              (!record.fontFamily ||
                record.fontFamily.includes('"Web Font"') ||
                record.fontFamily === 'sans-serif' ||
                record.name === 'Web Font')
            ) {
              try {
                const detected = await detectFontDetails(
                  record.webUrl,
                  record.name !== 'Web Font' ? record.name : undefined
                );
                const updated: CustomFontRecord = {
                  ...record,
                  name: record.name !== 'Web Font' ? record.name : detected.displayName,
                  fontFamily: `"${detected.fontFamily}", sans-serif`,
                };
                await saveStoredCustomFont(updated);
                return updated;
              } catch {
                return record;
              }
            }
            return record;
          })
        );

        if (!mounted) return;
        setCustomRecords(repaired);

        // Register each custom font into DOM
        for (const record of repaired) {
          if (record.sourceType === 'file' && record.fileData) {
            await registerLocalFontFace(record.fontFamily, record.fileData);
          } else if (record.sourceType === 'web' && record.webUrl) {
            await loadWebFontStylesheet(record.id, record.webUrl);
          }
        }
      } catch (err) {
        console.warn('Error loading custom fonts on mount:', err);
      } finally {
        if (mounted) setIsReady(true);
      }
    }

    initFonts();

    return () => {
      mounted = false;
    };
  }, []);

  // Convert custom records to FontOption list
  const customFontOptions = useMemo<FontOption[]>(() => {
    return customRecords.map((rec) => ({
      id: rec.id,
      name: rec.name,
      category: 'custom',
      fontFamily: rec.fontFamily,
      isCustom: true,
      sourceType: rec.sourceType,
      webUrl: rec.webUrl,
      fileName: rec.fileName,
      createdAt: rec.createdAt,
    }));
  }, [customRecords]);

  // Combined list of all available fonts
  const allFonts = useMemo<FontOption[]>(() => {
    return [...PRESET_FONTS, ...customFontOptions];
  }, [customFontOptions]);

  // The currently active font object
  const activeFont = useMemo<FontOption>(() => {
    const found = allFonts.find((f) => f.id === settings.selectedFontId);
    return found || PRESET_FONTS[0];
  }, [allFonts, settings.selectedFontId]);

  // Apply CSS custom properties and attributes to document root whenever font settings change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--app-font-family', activeFont.fontFamily);
    root.style.setProperty('--app-font-scale', `${settings.sizeScale / 100}`);
    root.style.setProperty('--app-letter-spacing', `${settings.letterSpacing ?? 0}px`);
    root.style.setProperty('--app-line-height', `${settings.lineHeight ?? 1.5}`);
    root.setAttribute('data-font-scope', settings.applyTo);

    // Also persist
    saveStoredFontSettings(settings);
  }, [activeFont, settings]);

  // Select a font
  const selectFont = useCallback(
    async (fontId: string) => {
      const target = allFonts.find((f) => f.id === fontId);
      if (!target) return;

      // Ensure web font is loaded before applying if it has a webUrl
      if (target.webUrl) {
        await loadWebFontStylesheet(target.id, target.webUrl);
      }

      setSettings((prev) => ({
        ...prev,
        selectedFontId: fontId,
      }));
    },
    [allFonts]
  );

  // Set apply scope ('all' | 'notes-only')
  const setApplyScope = useCallback((scope: FontApplyScope) => {
    setSettings((prev) => ({
      ...prev,
      applyTo: scope,
    }));
  }, []);

  // Set font size scale percentage
  const setSizeScale = useCallback((scale: number) => {
    setSettings((prev) => ({
      ...prev,
      sizeScale: scale,
    }));
  }, []);

  // Set letter spacing in pixels
  const setLetterSpacing = useCallback((spacing: number) => {
    setSettings((prev) => ({
      ...prev,
      letterSpacing: spacing,
    }));
  }, []);

  // Set line height multiplier
  const setLineHeight = useCallback((height: number) => {
    setSettings((prev) => ({
      ...prev,
      lineHeight: height,
    }));
  }, []);

  // Import a local font file (.ttf, .otf, .woff, .woff2)
  const importLocalFont = useCallback(
    async (file: File, customName?: string): Promise<{ success: boolean; font?: FontOption; error?: string }> => {
      // Validate file extension
      const lowerName = file.name.toLowerCase();
      const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
      const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));
      if (!isValid) {
        return {
          success: false,
          error: 'Please select a valid font file (.ttf, .otf, .woff, or .woff2)',
        };
      }

      // Max size limit: 50MB (expanded from 10MB)
      if (file.size > 50 * 1024 * 1024) {
        return {
          success: false,
          error: 'Font file size is too large (max 50MB)',
        };
      }

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read font file'));
          reader.readAsDataURL(file);
        });

        // Determine nice human name
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const fontDisplayName = (customName && customName.trim()) || baseName || 'Custom Font';
        const fontId = `custom_file_${Date.now()}`;
        const uniqueFamily = `CustomFont_${fontId.replace(/[^a-zA-Z0-9]/g, '')}`;

        // Register font with FontFace
        const registered = await registerLocalFontFace(uniqueFamily, dataUrl);
        if (!registered) {
          return {
            success: false,
            error: 'Failed to parse and activate font file. The file may be corrupt.',
          };
        }

        const newRecord: CustomFontRecord = {
          id: fontId,
          name: fontDisplayName,
          fontFamily: `"${uniqueFamily}", sans-serif`,
          sourceType: 'file',
          fileData: dataUrl,
          fileName: file.name,
          createdAt: Date.now(),
        };

        await saveStoredCustomFont(newRecord);
        setCustomRecords((prev) => [...prev, newRecord]);

        // Auto-select the newly imported font
        setSettings((prev) => ({
          ...prev,
          selectedFontId: fontId,
        }));

        const newOption: FontOption = {
          id: fontId,
          name: fontDisplayName,
          category: 'custom',
          fontFamily: newRecord.fontFamily,
          isCustom: true,
          sourceType: 'file',
          fileName: file.name,
          createdAt: newRecord.createdAt,
        };

        return { success: true, font: newOption };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Failed to import font file',
        };
      }
    },
    []
  );

  // Import a web / Google font or custom CSS stylesheet
  const importWebFont = useCallback(
    async (
      fontNameOrUrl: string,
      customName?: string
    ): Promise<{ success: boolean; font?: FontOption; error?: string }> => {
      const input = fontNameOrUrl.trim();
      if (!input) {
        return { success: false, error: 'Please enter a font name, CSS URL, or @import rule' };
      }

      try {
        const { webUrl, fontFamily, displayName } = await detectFontDetails(input, customName);

        if (!webUrl) {
          return { success: false, error: 'Invalid font URL or name provided' };
        }

        const fontId = `custom_web_${Date.now()}`;
        const fullFontFamily = `"${fontFamily}", sans-serif`;

        // Load stylesheet
        await loadWebFontStylesheet(fontId, webUrl);

        const newRecord: CustomFontRecord = {
          id: fontId,
          name: displayName,
          fontFamily: fullFontFamily,
          sourceType: 'web',
          webUrl,
          createdAt: Date.now(),
        };

        await saveStoredCustomFont(newRecord);
        setCustomRecords((prev) => [...prev, newRecord]);

        // Auto-select the newly imported font
        setSettings((prev) => ({
          ...prev,
          selectedFontId: fontId,
        }));

        const newOption: FontOption = {
          id: fontId,
          name: displayName,
          category: 'custom',
          fontFamily: fullFontFamily,
          isCustom: true,
          sourceType: 'web',
          webUrl,
          createdAt: newRecord.createdAt,
        };

        return { success: true, font: newOption };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Failed to load web font',
        };
      }
    },
    []
  );

  // Delete an imported custom font
  const removeCustomFont = useCallback(
    async (fontId: string) => {
      await deleteStoredCustomFont(fontId);
      setCustomRecords((prev) => prev.filter((r) => r.id !== fontId));

      // If active font was deleted, fallback to default
      if (settings.selectedFontId === fontId) {
        setSettings((prev) => ({
          ...prev,
          selectedFontId: DEFAULT_FONT_SETTINGS.selectedFontId,
        }));
      }
    },
    [settings.selectedFontId]
  );

  // Reset to default settings
  const resetToDefault = useCallback(() => {
    setSettings(DEFAULT_FONT_SETTINGS);
  }, []);

  return {
    settings,
    activeFont,
    presetFonts: PRESET_FONTS,
    customFonts: customFontOptions,
    allFonts,
    isReady,
    selectFont,
    setApplyScope,
    setSizeScale,
    setLetterSpacing,
    setLineHeight,
    importLocalFont,
    importWebFont,
    removeCustomFont,
    resetToDefault,
  };
}
