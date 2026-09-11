import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, RotateCcw, Check, Sparkles } from 'lucide-react';
import { NoteColorPreset } from '../types';
import { isValidHex, normalizeHex, isColorDark } from '../utils/themePresets';

interface NoteColorPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: NoteColorPreset[];
  onUpdatePreset: (id: string, updates: { name?: string; hex?: string }) => void;
  onAddPreset: (preset: { name: string; hex: string }) => void;
  onDeletePreset: (id: string) => void;
  onResetToDefaults: () => void;
}

export const NoteColorPresetsModal: React.FC<NoteColorPresetsModalProps> = ({
  isOpen,
  onClose,
  presets,
  onUpdatePreset,
  onAddPreset,
  onDeletePreset,
  onResetToDefaults,
}) => {
  // New preset form state
  const [newColorHex, setNewColorHex] = useState<string>('#A7F3D0');
  const [newName, setNewName] = useState<string>('Sage Mint');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidHex(newColorHex)) {
      setErrorMessage('Please enter a valid hex color code (e.g. #FDE047)');
      return;
    }
    setErrorMessage(null);
    onAddPreset({
      name: newName.trim() || 'Custom Color',
      hex: normalizeHex(newColorHex),
    });
    setNewName('');
    setNewColorHex('#FEE2E2');
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Note Color Presets Manager"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/25 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="relative z-[10001] w-full max-w-xl max-h-[90vh] bg-white border border-neutral-300 shadow-2xl flex flex-col overflow-hidden text-neutral-900 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-neutral-50/50 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 tracking-tight">
              Note Color Presets
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Customize or add color variations available when styling sticky notes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200/60 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Add New Color Preset Section */}
          <div className="p-3.5 bg-neutral-50 border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
                Add New Color Preset
              </span>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-wrap items-center gap-2.5">
              {/* Native color picker swatch */}
              <div
                className="relative w-8 h-8 border border-neutral-300 shadow-2xs shrink-0 cursor-pointer overflow-hidden"
                style={{ backgroundColor: isValidHex(newColorHex) ? newColorHex : '#FFFFFF' }}
                title="Click to choose a color"
              >
                <input
                  type="color"
                  value={isValidHex(newColorHex) ? normalizeHex(newColorHex) : '#FFFFFF'}
                  onChange={(e) => setNewColorHex(e.target.value.toUpperCase())}
                  className="absolute inset-[-4px] w-[200%] h-[200%] cursor-pointer opacity-0"
                />
              </div>

              {/* Hex Code Input */}
              <div className="w-24">
                <input
                  type="text"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value.toUpperCase())}
                  placeholder="#A7F3D0"
                  maxLength={7}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 font-mono text-xs text-neutral-800 focus:outline-neutral-900 uppercase bg-white"
                />
              </div>

              {/* Preset Name Input */}
              <div className="flex-1 min-w-[140px]">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Sage Mint, Coral Red"
                  className="w-full px-2.5 py-1.5 border border-neutral-300 text-xs text-neutral-800 focus:outline-neutral-900 bg-white"
                />
              </div>

              {/* Add Button */}
              <button
                type="submit"
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Preset</span>
              </button>
            </form>

            {errorMessage && (
              <p className="text-[11px] text-red-600 font-medium">{errorMessage}</p>
            )}
          </div>

          {/* Current Presets List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-800">
                Active Color Presets ({presets.length})
              </label>
              <span className="text-[11px] text-neutral-400">
                Click any swatch to change color or edit the name
              </span>
            </div>

            <div className="divide-y divide-neutral-200 border border-neutral-200 bg-white max-h-[340px] overflow-y-auto">
              {presets.map((preset) => {
                const dark = isColorDark(preset.hex);
                return (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-2.5 hover:bg-neutral-50 transition-colors gap-3"
                  >
                    {/* Color Swatch with Native Color Picker */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="relative w-8 h-8 border border-neutral-300 shadow-2xs shrink-0 cursor-pointer overflow-hidden flex items-center justify-center"
                        style={{ backgroundColor: preset.hex }}
                        title="Click to pick a new color for this preset"
                      >
                        <input
                          type="color"
                          value={isValidHex(preset.hex) ? normalizeHex(preset.hex) : '#FFFFFF'}
                          onChange={(e) =>
                            onUpdatePreset(preset.id, { hex: e.target.value.toUpperCase() })
                          }
                          className="absolute inset-[-4px] w-[200%] h-[200%] cursor-pointer opacity-0"
                        />
                        <span
                          className={`text-[9px] font-mono select-none pointer-events-none ${
                            dark ? 'text-white/80' : 'text-neutral-900/60'
                          }`}
                        >
                          Aa
                        </span>
                      </div>

                      {/* Name input */}
                      <input
                        type="text"
                        value={preset.name}
                        onChange={(e) => onUpdatePreset(preset.id, { name: e.target.value })}
                        className="flex-1 min-w-[100px] px-2 py-1 border border-transparent hover:border-neutral-300 focus:border-neutral-900 focus:outline-none text-xs text-neutral-900 font-medium bg-transparent"
                      />
                    </div>

                    {/* Hex Code Input */}
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="text"
                        value={preset.hex}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.startsWith('#') || val.length === 0) {
                            onUpdatePreset(preset.id, { hex: val });
                          } else {
                            onUpdatePreset(preset.id, { hex: `#${val}` });
                          }
                        }}
                        maxLength={7}
                        className="w-20 px-1.5 py-1 border border-neutral-200 font-mono text-[11px] text-neutral-700 uppercase text-center focus:outline-neutral-900"
                        title="Hex code"
                      />

                      {/* Tone indicator */}
                      <span
                        className={`text-[10px] px-1.5 py-0.5 border ${
                          dark
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}
                        title={dark ? 'Dark tone (uses light text)' : 'Light tone (uses dark text)'}
                      >
                        {dark ? 'Dark' : 'Light'}
                      </span>

                      {/* Delete button */}
                      <button
                        type="button"
                        disabled={presets.length <= 1}
                        onClick={() => onDeletePreset(preset.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title={
                          presets.length <= 1
                            ? 'Cannot delete the only preset'
                            : 'Delete this preset'
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-200 bg-neutral-50/70 text-xs shrink-0">
          <button
            type="button"
            onClick={onResetToDefaults}
            className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Default Colors</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};
