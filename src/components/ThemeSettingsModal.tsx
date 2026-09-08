import React, { useState, useEffect } from 'react';
import {
  X,
  Palette,
  RotateCcw,
  Check,
  FileText,
  CheckSquare,
} from 'lucide-react';
import { ThemeColorPreset } from '../types';
import {
  DEFAULT_THEME_COLOR,
  isValidHex,
  normalizeHex,
} from '../utils/themePresets';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeColor: string;
  onSelectColor: (hex: string) => void;
  onResetColor: () => void;
  presets: ThemeColorPreset[];
  activePreset?: ThemeColorPreset;
  isDark: boolean;
}

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  isOpen,
  onClose,
  themeColor,
  onSelectColor,
  onResetColor,
  presets,
  activePreset,
  isDark,
}) => {
  const [customInput, setCustomInput] = useState<string>(themeColor);

  useEffect(() => {
    setCustomInput(themeColor);
  }, [themeColor]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCustomTextChange = (value: string) => {
    setCustomInput(value);
    if (isValidHex(value)) {
      onSelectColor(normalizeHex(value));
    }
  };

  const handleNativeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomInput(val.toUpperCase());
    onSelectColor(val);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-[10001] w-full max-w-lg max-h-[90vh] theme-ui-bg border border-neutral-300 shadow-2xl flex flex-col overflow-hidden text-neutral-900 animate-in zoom-in-95 duration-150"
        style={{ backgroundColor: 'var(--theme-bg, #ffffff)' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-neutral-900 text-white rounded-none">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 id="theme-modal-title" className="text-sm font-bold tracking-tight">
                Theme Color
              </h2>
              <p className="text-[11px] text-neutral-500">
                Change the background of the canvas, sticky notes, and UI controls.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            title="Close dialog (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Live Preview Card */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
              <span>Live Preview</span>
              <span className="text-[11px] font-mono text-neutral-500">
                {activePreset ? activePreset.name : 'Custom Color'} ({themeColor})
              </span>
            </div>

            <div
              className="p-3 border border-neutral-300 rounded-none shadow-inner transition-colors duration-150 flex flex-col gap-2.5 min-h-[110px] justify-center"
              style={{ backgroundColor: themeColor }}
            >
              {/* Mini Sticky Note Mockup */}
              <div
                className="w-full max-w-xs mx-auto border border-neutral-300 shadow-xs p-2 text-xs flex flex-col gap-1 transition-colors"
                style={{
                  backgroundColor: themeColor,
                  color: isDark ? '#f3f4f6' : '#171717',
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#d4d4d4',
                }}
              >
                <div
                  className="flex items-center justify-between pb-1 border-b border-neutral-200/80 text-[10px]"
                  style={{ borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#e5e5e5' }}
                >
                  <div className="flex items-center gap-1 font-semibold">
                    <FileText className="w-3 h-3" />
                    <span>Project Priorities</span>
                  </div>
                  <span className="text-[9px] opacity-60">Markdown</span>
                </div>
                <div className="space-y-1 text-[11px] leading-tight">
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className="w-3 h-3 text-neutral-900" style={{ color: isDark ? '#f3f4f6' : '#171717' }} />
                    <span className="line-through opacity-70">Review architectural plan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 border border-neutral-400 shrink-0" />
                    <span>Deliver release sprint</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Curated Color Presets */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-neutral-700 block">
              Curated Theme Palettes
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presets.map((preset) => {
                const isSelected =
                  normalizeHex(themeColor) === normalizeHex(preset.hex);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectColor(preset.hex)}
                    className={`flex items-center gap-2.5 p-2 text-left border transition-all ${
                      isSelected
                        ? 'border-neutral-900 ring-1 ring-neutral-900 bg-neutral-50/50'
                        : 'border-neutral-200 hover:border-neutral-400 bg-white/70'
                    }`}
                  >
                    <span
                      className="w-5 h-5 shrink-0 rounded-full border border-neutral-300 shadow-2xs flex items-center justify-center"
                      style={{ backgroundColor: preset.hex }}
                    >
                      {isSelected && (
                        <Check
                          className={`w-3 h-3 ${
                            preset.dark ? 'text-white' : 'text-neutral-900'
                          }`}
                        />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-neutral-900 truncate">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono truncate">
                        {preset.hex}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Input */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-200">
            <span className="text-xs font-semibold text-neutral-700 block">
              Custom Hex Color
            </span>
            <div className="flex items-center gap-2">
              {/* Native Color Picker Trigger */}
              <div className="relative w-9 h-8 border border-neutral-300 shrink-0 overflow-hidden cursor-pointer">
                <input
                  type="color"
                  value={isValidHex(themeColor) ? normalizeHex(themeColor) : DEFAULT_THEME_COLOR}
                  onChange={handleNativeColorChange}
                  className="absolute inset-[-4px] w-[200%] h-[200%] cursor-pointer opacity-0"
                  title="Pick a custom color"
                />
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: themeColor }}
                />
              </div>

              {/* Hex Text Input */}
              <input
                type="text"
                value={customInput}
                onChange={(e) => handleCustomTextChange(e.target.value)}
                placeholder="#FFFFFF"
                maxLength={7}
                className="flex-1 px-3 py-1.5 border border-neutral-300 text-xs font-mono text-neutral-800 uppercase focus:outline-neutral-900 theme-ui-bg"
              />

              {/* Reset to White Button */}
              <button
                type="button"
                onClick={onResetColor}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 hover:bg-neutral-100 text-xs text-neutral-700 transition-colors shrink-0"
                title="Reset to default white background (#FFFFFF)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
            <p className="text-[11px] text-neutral-500">
              Pick any shade using the color swatch or type a 6-digit hex code. Text contrast automatically adjusts for dark colors.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50/80 border-t border-neutral-200 shrink-0">
          <span className="text-[11px] text-neutral-500">
            Applies across canvas, notes, and menus
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
