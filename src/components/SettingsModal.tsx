import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Palette,
  Type,
  Paintbrush,
  Sliders,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Upload,
  Globe,
  Highlighter,
  AlertCircle,
  CheckSquare,
  Sparkles,
  MoveHorizontal,
  MoveVertical,
} from 'lucide-react';
import {
  FontOption,
  FontApplyScope,
  ThemeColorPreset,
  NoteColorPreset,
  CustomMarkdownRule,
} from '../types';
import { HighlightColorPreset } from '../hooks/useNoteColorPresets';
import {
  isValidHex,
  normalizeHex,
  isColorDark,
  DEFAULT_THEME_COLOR,
} from '../utils/themePresets';
import { CustomMarkdownSettingsTab } from './CustomMarkdownSettingsTab';

export type SettingsTab = 'notes' | 'font' | 'markdown' | 'theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;

  // Note Color & Highlight Props
  notePresets: NoteColorPreset[];
  highlightColor: string;
  highlightPresets: HighlightColorPreset[];
  onUpdateNotePreset: (id: string, updates: { name?: string; hex?: string }) => void;
  onAddNotePreset: (preset: { name: string; hex: string }) => void;
  onDeleteNotePreset: (id: string) => void;
  onResetNotePresets: () => void;
  onSetHighlightColor: (color: string) => void;
  onResetHighlightColor: () => void;

  // Font Props
  activeFont: FontOption;
  presetFonts: FontOption[];
  customFonts: FontOption[];
  applyScope: FontApplyScope;
  sizeScale: number;
  letterSpacing?: number;
  lineHeight?: number;
  onSelectFont: (fontId: string) => void;
  onSetApplyScope: (scope: FontApplyScope) => void;
  onSetSizeScale: (scale: number) => void;
  onSetLetterSpacing?: (spacing: number) => void;
  onSetLineHeight?: (lineHeight: number) => void;
  onImportLocalFont: (file: File, customName?: string) => Promise<{ success: boolean; font?: FontOption; error?: string }>;
  onImportWebFont: (fontNameOrUrl: string, customName?: string) => Promise<{ success: boolean; font?: FontOption; error?: string }>;
  onRemoveCustomFont: (fontId: string) => Promise<void>;
  onResetFontToDefault: () => void;

  // Theme Props
  themeColor: string;
  onSelectThemeColor: (hex: string) => void;
  onResetThemeColor: () => void;
  themePresets: ThemeColorPreset[];
  activeThemePreset?: ThemeColorPreset;
  isThemeDark: boolean;

  // Custom Markdown Props
  customMarkdownRules?: CustomMarkdownRule[];
  onAddCustomMarkdownRule?: (rule: Omit<CustomMarkdownRule, 'id' | 'createdAt'>) => CustomMarkdownRule;
  onUpdateCustomMarkdownRule?: (id: string, updates: Partial<CustomMarkdownRule>) => void;
  onDeleteCustomMarkdownRule?: (id: string) => void;
  onDuplicateCustomMarkdownRule?: (id: string) => CustomMarkdownRule | null;
  onResetCustomMarkdownRules?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'notes',

  // Note colors & highlight
  notePresets,
  highlightColor,
  highlightPresets,
  onUpdateNotePreset,
  onAddNotePreset,
  onDeleteNotePreset,
  onResetNotePresets,
  onSetHighlightColor,
  onResetHighlightColor,

  // Font
  activeFont,
  presetFonts,
  customFonts,
  applyScope,
  sizeScale,
  letterSpacing = 0,
  lineHeight = 1.5,
  onSelectFont,
  onSetApplyScope,
  onSetSizeScale,
  onSetLetterSpacing,
  onSetLineHeight,
  onImportLocalFont,
  onImportWebFont,
  onRemoveCustomFont,
  onResetFontToDefault,

  // Theme
  themeColor,
  onSelectThemeColor,
  onResetThemeColor,
  themePresets,
  activeThemePreset,
  isThemeDark,

  // Custom Markdown
  customMarkdownRules = [],
  onAddCustomMarkdownRule,
  onUpdateCustomMarkdownRule,
  onDeleteCustomMarkdownRule,
  onDuplicateCustomMarkdownRule,
  onResetCustomMarkdownRules,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Sync initial tab whenever modal is opened
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Handle ESC key to close
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

  // Status feedback toast
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // ================= NOTE COLORS & HIGHLIGHT STATE =================
  const [newColorHex, setNewColorHex] = useState<string>('#A7F3D0');
  const [newName, setNewName] = useState<string>('Sage Mint');
  const [notePresetError, setNotePresetError] = useState<string | null>(null);
  const [customHighlightInput, setCustomHighlightInput] = useState<string>(highlightColor);

  useEffect(() => {
    setCustomHighlightInput(highlightColor);
  }, [highlightColor]);

  const handleAddNotePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidHex(newColorHex)) {
      setNotePresetError('Please enter a valid hex color code (e.g. #FDE047)');
      return;
    }
    setNotePresetError(null);
    onAddNotePreset({
      name: newName.trim() || 'Custom Color',
      hex: normalizeHex(newColorHex),
    });
    setNewName('');
    setNewColorHex('#FEE2E2');
    showStatus('Added note color preset');
  };

  // ================= FONT STATE =================
  const [fontSubTab, setFontSubTab] = useState<'presets' | 'import-file' | 'import-web'>('presets');
  const [testWords, setTestWords] = useState<string>('The quick brown fox jumps over the lazy dog.');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFileFontName, setCustomFileFontName] = useState('');
  const [fileImportError, setFileImportError] = useState<string | null>(null);
  const [isImportingFile, setIsImportingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [webFontInput, setWebFontInput] = useState('');
  const [customWebFontName, setCustomWebFontName] = useState('');
  const [webImportError, setWebImportError] = useState<string | null>(null);
  const [isImportingWeb, setIsImportingWeb] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setFileImportError(null);
    const inferred = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (!customFileFontName) {
      setCustomFileFontName(inferred);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setFileImportError(null);
    const inferred = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (!customFileFontName) {
      setCustomFileFontName(inferred);
    }
  };

  const handleSubmitFileImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileImportError('Please choose a font file (.ttf, .otf, .woff, .woff2)');
      return;
    }
    setIsImportingFile(true);
    setFileImportError(null);

    const res = await onImportLocalFont(selectedFile, customFileFontName);
    setIsImportingFile(false);

    if (res.success && res.font) {
      showStatus(`Imported "${res.font.name}" successfully!`);
      setSelectedFile(null);
      setCustomFileFontName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFontSubTab('presets');
    } else {
      setFileImportError(res.error || 'Failed to import font');
    }
  };

  const handleSubmitWebImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webFontInput.trim()) {
      setWebImportError('Please provide a Google Font name or URL');
      return;
    }
    setIsImportingWeb(true);
    setWebImportError(null);

    const res = await onImportWebFont(webFontInput, customWebFontName);
    setIsImportingWeb(false);

    if (res.success && res.font) {
      showStatus(`Imported "${res.font.name}" successfully!`);
      setWebFontInput('');
      setCustomWebFontName('');
      setFontSubTab('presets');
    } else {
      setWebImportError(res.error || 'Failed to import font');
    }
  };

  // ================= THEME STATE =================
  const [customThemeInput, setCustomThemeInput] = useState<string>(themeColor);
  useEffect(() => {
    setCustomThemeInput(themeColor);
  }, [themeColor]);

  const handleCustomThemeChange = (value: string) => {
    setCustomThemeInput(value);
    if (isValidHex(value)) {
      onSelectThemeColor(normalizeHex(value));
    }
  };

  if (!isOpen) return null;

  const isHighlightDark = isColorDark(highlightColor);

  const modalContent = (
    <div
      id="settings-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/35 select-none transition-all duration-150 animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="settings-dialog"
        onClick={(e) => e.stopPropagation()}
        className="relative z-[10001] w-full max-w-2xl max-h-[92vh] bg-white border border-neutral-300 shadow-2xl flex flex-col overflow-hidden text-neutral-900 animate-in zoom-in-95 duration-150"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-neutral-200 bg-neutral-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-neutral-900 text-white flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 id="settings-dialog-title" className="text-sm font-semibold tracking-tight text-neutral-900">
                Appearance & Customization
              </h2>
              <p className="text-[11px] text-neutral-500">
                Configure note colors, typography fonts, and canvas theme
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors"
            title="Close dialog (Esc)"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher Navigation */}
        <div className="flex items-center border-b border-neutral-200 bg-neutral-100/60 px-5 gap-2 shrink-0">
          {/* Note Colors & Highlight Tab */}
          <button
            type="button"
            id="tab-btn-notes"
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'notes'
                ? 'border-neutral-900 text-neutral-950 bg-white shadow-2xs'
                : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-black/5'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-neutral-600" />
            <span>Note Colors</span>
          </button>

          {/* Typography / Font Tab */}
          <button
            type="button"
            id="tab-btn-font"
            onClick={() => setActiveTab('font')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'font'
                ? 'border-neutral-900 text-neutral-950 bg-white shadow-2xs'
                : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-black/5'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-neutral-600" />
            <span>Font & Text</span>
          </button>

          {/* Custom Markdown Tab */}
          <button
            type="button"
            id="tab-btn-markdown"
            onClick={() => setActiveTab('markdown')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'markdown'
                ? 'border-neutral-900 text-neutral-950 bg-white shadow-2xs'
                : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-black/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-black-600" />
            <span>Custom Markdown</span>
          </button>

          {/* Canvas Theme Tab */}
          <button
            type="button"
            id="tab-btn-theme"
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'theme'
                ? 'border-neutral-900 text-neutral-950 bg-white shadow-2xs'
                : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-black/5'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5 text-neutral-600" />
            <span>Canvas Theme</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Status toast if message exists */}
          {statusMessage && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: NOTE COLORS & HIGHLIGHT COLOR SETTING              */}
          {/* ========================================================= */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              {/* Highlight Color Setting Section */}
              <div
                id="highlight-color-settings-section"
                className="p-4 bg-neutral-50 border border-neutral-200 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-neutral-900 text-white">
                      <Highlighter className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                        <span>Markdown Highlight Color</span>
                        <code className="font-mono text-[10px] bg-neutral-200/80 px-1 py-0.2 text-neutral-700">
                          ==text==
                        </code>
                      </h3>
                      <p className="text-[11px] text-neutral-500">
                        Choose the accent color for highlighted text in sticky notes and markdown preview.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onResetHighlightColor();
                      setCustomHighlightInput('#FEF08A');
                      showStatus('Reset highlight color to Canary Yellow');
                    }}
                    className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors"
                    title="Reset to default yellow highlight"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden sm:inline">Reset Highlight</span>
                  </button>
                </div>

                {/* Live Highlight Preview Note Mockup */}
                <div className="p-3 bg-white border border-neutral-300 shadow-2xs flex items-center justify-between gap-3 select-text">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Live Preview in Note
                    </span>
                    <p className="text-xs text-neutral-800 leading-relaxed">
                      Use{' '}
                      <mark
                        className="px-1.5 py-0.5 font-medium mx-0.5 inline-block relative transition-colors"
                        style={{
                          backgroundColor: highlightColor,
                          color: isHighlightDark ? '#ffffff' : '#1e293b',
                          transform: 'rotate(-1.2deg)',
                        }}
                      >
                        highlighted text
                      </mark>{' '}
                      to emphasize key ideas, deadlines, and priorities.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-[11px] font-medium text-neutral-700 bg-neutral-100 px-2 py-1 border border-neutral-200 uppercase">
                      {highlightColor}
                    </span>
                  </div>
                </div>

                {/* Curated Highlight Palette Swatches */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-neutral-700 block">
                    Curated Highlighter Swatches
                  </span>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {highlightPresets.map((preset) => {
                      const isSelected =
                        normalizeHex(highlightColor) === normalizeHex(preset.hex);
                      const isPresetDark = isColorDark(preset.hex);
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            onSetHighlightColor(preset.hex);
                            setCustomHighlightInput(preset.hex);
                          }}
                          className={`relative h-8 border transition-all flex flex-col items-center justify-center group ${
                            isSelected
                              ? 'ring-2 ring-neutral-900 border-transparent shadow-xs scale-105 z-10'
                              : 'border-neutral-300 hover:border-neutral-500 hover:scale-102'
                          }`}
                          style={{ backgroundColor: preset.hex }}
                          title={`${preset.name} (${preset.hex})`}
                        >
                          {isSelected && (
                            <Check
                              className={`w-3.5 h-3.5 ${
                                isPresetDark ? 'text-white' : 'text-neutral-900'
                              }`}
                            />
                          )}
                          <span
                            className={`text-[8px] font-mono opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-0.5 ${
                              isPresetDark ? 'text-white' : 'text-neutral-900'
                            }`}
                          >
                            Aa
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Highlight Hex Color Picker */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-neutral-500 whitespace-nowrap">
                    Custom Hex:
                  </span>
                  <div className="relative w-7 h-7 border border-neutral-300 shadow-2xs shrink-0 cursor-pointer overflow-hidden">
                    <input
                      type="color"
                      value={isValidHex(highlightColor) ? normalizeHex(highlightColor) : '#FEF08A'}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setCustomHighlightInput(val);
                        onSetHighlightColor(val);
                      }}
                      className="absolute inset-[-4px] w-[200%] h-[200%] cursor-pointer opacity-0"
                      title="Pick custom highlight color"
                    />
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: highlightColor }}
                    />
                  </div>
                  <input
                    type="text"
                    value={customHighlightInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomHighlightInput(val);
                      if (isValidHex(val)) {
                        onSetHighlightColor(normalizeHex(val));
                      }
                    }}
                    maxLength={7}
                    placeholder="#FEF08A"
                    className="w-24 px-2 py-1 bg-white border border-neutral-300 font-mono text-xs uppercase text-neutral-800 focus:outline-neutral-900"
                  />
                  <span className="text-[10px] text-neutral-400">
                    Shortcut in notes: <kbd className="font-mono bg-neutral-200 px-1 py-0.5 text-neutral-700">Ctrl+H</kbd> / <kbd className="font-mono bg-neutral-200 px-1 py-0.5 text-neutral-700">Cmd+H</kbd>
                  </span>
                </div>
              </div>

              {/* Note Color Presets Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-900">
                      Sticky Note Color Presets ({notePresets.length})
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Colors available in the sticky note color picker and toolbar spawner.
                    </p>
                  </div>
                </div>

                {/* Add New Color Preset Form */}
                <div className="p-3 bg-neutral-50 border border-neutral-200 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                    <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Add New Note Color Preset</span>
                  </div>

                  <form onSubmit={handleAddNotePreset} className="flex flex-wrap items-center gap-2">
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
                    <div className="flex-1 min-w-[130px]">
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

                  {notePresetError && (
                    <p className="text-[11px] text-red-600 font-medium">{notePresetError}</p>
                  )}
                </div>

                {/* Active Presets List */}
                <div className="divide-y divide-neutral-200 border border-neutral-200 bg-white max-h-[220px] overflow-y-auto">
                  {notePresets.map((preset) => {
                    const dark = isColorDark(preset.hex);
                    return (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between p-2 hover:bg-neutral-50 transition-colors gap-3"
                      >
                        {/* Color Swatch with Native Color Picker */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className="relative w-7 h-7 border border-neutral-300 shadow-2xs shrink-0 cursor-pointer overflow-hidden flex items-center justify-center"
                            style={{ backgroundColor: preset.hex }}
                            title="Click to pick a new color for this preset"
                          >
                            <input
                              type="color"
                              value={isValidHex(preset.hex) ? normalizeHex(preset.hex) : '#FFFFFF'}
                              onChange={(e) =>
                                onUpdateNotePreset(preset.id, { hex: e.target.value.toUpperCase() })
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
                            onChange={(e) => onUpdateNotePreset(preset.id, { name: e.target.value })}
                            className="flex-1 min-w-[100px] px-2 py-0.5 border border-transparent hover:border-neutral-300 focus:border-neutral-900 focus:outline-none text-xs text-neutral-900 font-medium bg-transparent"
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
                                onUpdateNotePreset(preset.id, { hex: val });
                              } else {
                                onUpdateNotePreset(preset.id, { hex: `#${val}` });
                              }
                            }}
                            maxLength={7}
                            className="w-20 px-1.5 py-0.5 border border-neutral-200 font-mono text-[11px] text-neutral-700 uppercase text-center focus:outline-neutral-900"
                            title="Hex code"
                          />

                          {/* Tone indicator */}
                          <span
                            className={`text-[9px] px-1.5 py-0.5 border ${
                              dark
                                ? 'bg-neutral-900 text-white border-neutral-900'
                                : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                            }`}
                            title={dark ? 'Dark tone note (uses white text)' : 'Light tone note (uses dark text)'}
                          >
                            {dark ? 'Dark' : 'Light'}
                          </span>

                          {/* Delete button */}
                          <button
                            type="button"
                            disabled={notePresets.length <= 1}
                            onClick={() => onDeleteNotePreset(preset.id)}
                            className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            title={
                              notePresets.length <= 1
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
          )}

          {/* ========================================================= */}
          {/* TAB 2: FONT & TYPOGRAPHY SETTINGS                         */}
          {/* ========================================================= */}
          {activeTab === 'font' && (
            <div className="space-y-5">
              {/* Live Word Specimen & Font Tester */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Live Font & Words Preview
                  </span>
                  <span className="text-[11px] font-mono text-neutral-600">
                    Current: <strong className="text-neutral-900">{activeFont.name}</strong>
                  </span>
                </div>

                {/* Interactive Preview Container */}
                <div
                  className="p-3 bg-white border border-neutral-200 min-h-[72px] flex items-center transition-all select-text"
                  style={{
                    fontFamily: activeFont.fontFamily,
                    fontSize: `${13 * (sizeScale / 100)}px`,
                    letterSpacing: `${letterSpacing}px`,
                    lineHeight: lineHeight,
                  }}
                >
                  <span className="text-neutral-900 break-words w-full whitespace-pre-wrap">
                    {testWords || 'Pinboard: Organize ideas with Markdown notes.\nDouble-click to write, format tasks, and drag anywhere.'}
                  </span>
                </div>

                {/* Quick Word Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={testWords}
                    onChange={(e) => setTestWords(e.target.value)}
                    placeholder="Type custom words to preview..."
                    className="flex-1 px-2.5 py-1.5 bg-white border border-neutral-300 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => setTestWords('Pinboard: Markdown sticky notes canvas')}
                    className="px-2 py-1.5 text-[11px] text-neutral-600 bg-white border border-neutral-300 hover:bg-neutral-100 transition-colors whitespace-nowrap"
                  >
                    Sample 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestWords('Pinboard: Organize thoughts cleanly.\nLetter spacing & line height adapt to your reading flow.')}
                    className="px-2 py-1.5 text-[11px] text-neutral-600 bg-white border border-neutral-300 hover:bg-neutral-100 transition-colors whitespace-nowrap"
                    title="Test multi-line text to preview line spacing"
                  >
                    Multi-line
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestWords('Aa Bb Gg Qq 0123456789 # * - [x] & @ !')}
                    className="px-2 py-1.5 text-[11px] text-neutral-600 bg-white border border-neutral-300 hover:bg-neutral-100 transition-colors whitespace-nowrap"
                  >
                    Glyphs
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestWords('永和九年，歲在癸丑，暮春之初，會于會稽山陰之蘭亭。Pinboard 123')}
                    className="px-2 py-1.5 text-[11px] text-neutral-600 bg-white border border-neutral-300 hover:bg-neutral-100 transition-colors whitespace-nowrap"
                    title="Preview Chinese / CJK glyphs"
                  >
                    中文 / CJK
                  </button>
                </div>
              </div>

              {/* Navigation Sub-Tabs */}
              <div className="flex items-center border-b border-neutral-200 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setFontSubTab('presets')}
                  className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
                    fontSubTab === 'presets'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Built-in & Saved Fonts</span>
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-neutral-100 text-neutral-600">
                    {presetFonts.length + customFonts.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFontSubTab('import-file')}
                  className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
                    fontSubTab === 'import-file'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Font File</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFontSubTab('import-web')}
                  className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
                    fontSubTab === 'import-web'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Import Web Font / CSS</span>
                </button>
              </div>

              {/* Sub-tab 1: Presets & Custom List */}
              {fontSubTab === 'presets' && (
                <div className="space-y-4">
                  {/* Custom Imported Fonts Section */}
                  {customFonts.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-800">
                          Your Imported Fonts ({customFonts.length})
                        </span>
                        <span className="text-[10px] text-neutral-400">Stored locally in your browser</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {customFonts.map((font) => {
                          const isSelected = activeFont.id === font.id;
                          return (
                            <div
                              key={font.id}
                              onClick={() => onSelectFont(font.id)}
                              className={`relative group p-2.5 border cursor-pointer transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                                  : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-800'
                              }`}
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-xs truncate">{font.name}</span>
                                  <span
                                    className={`text-[9px] px-1 py-0.2 uppercase tracking-wider ${
                                      isSelected ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-500'
                                    }`}
                                  >
                                    {font.sourceType === 'file' ? 'File' : 'Web'}
                                  </span>
                                </div>
                                <p
                                  className={`text-xs mt-1 truncate ${
                                    isSelected ? 'text-neutral-300' : 'text-neutral-500'
                                  }`}
                                  style={{ fontFamily: font.fontFamily }}
                                >
                                  The quick brown fox
                                </p>
                              </div>

                              <div className="flex items-center gap-1">
                                {isSelected && <Check className="w-3.5 h-3.5 text-white mr-1" />}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveCustomFont(font.id);
                                  }}
                                  className={`p-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                                    isSelected
                                      ? 'hover:bg-neutral-800 text-neutral-300 hover:text-red-300'
                                      : 'hover:bg-neutral-100 text-neutral-400 hover:text-red-600'
                                  }`}
                                  title="Remove custom font"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Curated Presets */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-neutral-800">Curated Font Presets</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {presetFonts.map((font) => {
                        const isSelected = activeFont.id === font.id;
                        return (
                          <button
                            type="button"
                            key={font.id}
                            onClick={() => onSelectFont(font.id)}
                            className={`text-left p-2.5 border transition-all flex items-center justify-between ${
                              isSelected
                                ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                                : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-800'
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-xs truncate">{font.name}</span>
                                <span
                                  className={`text-[9px] px-1 py-0.2 uppercase tracking-wider ${
                                    isSelected ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-500'
                                  }`}
                                >
                                  {font.category}
                                </span>
                              </div>
                              <p
                                className={`text-xs mt-1 truncate ${
                                  isSelected ? 'text-neutral-300' : 'text-neutral-500'
                                }`}
                                style={{ fontFamily: font.fontFamily }}
                              >
                                The quick brown fox
                              </p>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Upload local font */}
              {fontSubTab === 'import-file' && (
                <form onSubmit={handleSubmitFileImport} className="space-y-4">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-300 hover:border-neutral-500 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-neutral-50/50"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                    <p className="text-xs font-semibold text-neutral-800">
                      {selectedFile ? selectedFile.name : 'Click or drop a font file here'}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Supports TrueType (.ttf), OpenType (.otf), WOFF (.woff), and WOFF2 (.woff2)
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-700 block">
                      Custom Font Display Name
                    </label>
                    <input
                      type="text"
                      value={customFileFontName}
                      onChange={(e) => setCustomFileFontName(e.target.value)}
                      placeholder="e.g. My Custom Font"
                      className="w-full px-3 py-1.5 border border-neutral-300 text-xs text-neutral-800 focus:outline-neutral-900 bg-white"
                    />
                  </div>

                  {fileImportError && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 p-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fileImportError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setCustomFileFontName('');
                        setFontSubTab('presets');
                      }}
                      className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedFile || isImportingFile}
                      className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {isImportingFile ? <span>Registering font...</span> : <span>Install & Use Font</span>}
                    </button>
                  </div>
                </form>
              )}

              {/* Sub-tab 3: Web Font / CSS import */}
              {fontSubTab === 'import-web' && (
                <form onSubmit={handleSubmitWebImport} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-800 block">
                      Font Name, CSS URL, or @import Rule
                    </label>
                    <input
                      type="text"
                      value={webFontInput}
                      onChange={(e) => setWebFontInput(e.target.value)}
                      placeholder='e.g. https://fontsapi.zeoseven.com/371/main/result.css, @import url("..."), or "Poppins"'
                      className="w-full px-3 py-1.5 border border-neutral-300 text-xs text-neutral-800 focus:outline-neutral-900 font-mono bg-white"
                    />
                    <p className="text-[11px] text-neutral-500 leading-normal">
                      Paste any CSS font URL, an{' '}
                      <code className="font-mono text-[10px] bg-neutral-100 px-1 py-0.5 border border-neutral-200 text-neutral-700">
                        @import url(...)
                      </code>{' '}
                      statement, or a Google Font name.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-700 block">
                      Custom Display Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={customWebFontName}
                      onChange={(e) => setCustomWebFontName(e.target.value)}
                      placeholder="e.g. My Font (leave empty to auto-detect)"
                      className="w-full px-3 py-1.5 border border-neutral-300 text-xs text-neutral-800 focus:outline-neutral-900 bg-white"
                    />
                  </div>

                  {webImportError && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 p-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{webImportError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setWebFontInput('');
                        setCustomWebFontName('');
                        setFontSubTab('presets');
                      }}
                      className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!webFontInput.trim() || isImportingWeb}
                      className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {isImportingWeb ? <span>Fetching font...</span> : <span>Fetch & Apply Font</span>}
                    </button>
                  </div>
                </form>
              )}

              {/* Scope & Typography Spacing Configuration */}
              <div className="pt-4 border-t border-neutral-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-neutral-500" />
                    Typography & Layout Adjustments
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onSetSizeScale(100);
                      onSetLetterSpacing?.(0);
                      onSetLineHeight?.(1.5);
                    }}
                    className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors"
                    title="Reset size, letter spacing, and line height to normal"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Spacing</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Scope */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-800 block">
                      Apply Font To:
                    </label>
                    <div className="flex border border-neutral-300">
                      <button
                        type="button"
                        onClick={() => onSetApplyScope('all')}
                        className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                          applyScope === 'all'
                            ? 'bg-neutral-900 text-white'
                            : 'bg-white text-neutral-700 hover:bg-neutral-100'
                        }`}
                        title="Applies custom font across all interface menus, notes, and toolbar"
                      >
                        All Interface
                      </button>
                      <button
                        type="button"
                        onClick={() => onSetApplyScope('notes-only')}
                        className={`flex-1 py-1.5 text-xs font-medium border-l border-neutral-300 transition-colors ${
                          applyScope === 'notes-only'
                            ? 'bg-neutral-900 text-white'
                            : 'bg-white text-neutral-700 hover:bg-neutral-100'
                        }`}
                        title="Applies custom font only to sticky note cards and written content"
                      >
                        Notes Only
                      </button>
                    </div>
                  </div>

                  {/* Size Scale */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-neutral-800">
                        Text Size Scale:
                      </label>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-800 font-semibold">
                        {sizeScale}%
                      </span>
                    </div>

                    {/* Slider */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400 font-mono">75%</span>
                      <input
                        type="range"
                        min="75"
                        max="150"
                        step="5"
                        value={sizeScale}
                        onChange={(e) => onSetSizeScale(Number(e.target.value))}
                        className="flex-1 accent-neutral-900 cursor-pointer h-1.5 bg-neutral-200"
                        aria-label="Text font size scale slider"
                      />
                      <span className="text-[10px] text-neutral-400 font-mono">150%</span>
                    </div>

                    {/* Quick preset buttons */}
                    <div className="grid grid-cols-6 gap-1">
                      {[80, 90, 100, 110, 125, 140].map((scale) => (
                        <button
                          type="button"
                          key={scale}
                          onClick={() => onSetSizeScale(scale)}
                          className={`py-1 text-[11px] font-medium border transition-colors ${
                            sizeScale === scale
                              ? 'border-neutral-900 bg-neutral-900 text-white'
                              : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          {scale}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Letter Spacing (Tracking) */}
                  <div className="space-y-2 p-3 bg-neutral-50/80 border border-neutral-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-neutral-800 flex items-center gap-1.5">
                        <MoveHorizontal className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Letter Spacing (Tracking)</span>
                      </label>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 bg-white border border-neutral-300 text-neutral-800 font-semibold">
                        {letterSpacing > 0 ? `+${letterSpacing}px` : `${letterSpacing}px`}
                        {letterSpacing === 0 ? ' (Normal)' : ''}
                      </span>
                    </div>

                    {/* Slider */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400 font-mono">-2px</span>
                      <input
                        type="range"
                        min="-2"
                        max="6"
                        step="0.5"
                        value={letterSpacing}
                        onChange={(e) => onSetLetterSpacing?.(Number(e.target.value))}
                        className="flex-1 accent-neutral-900 cursor-pointer h-1.5 bg-neutral-200"
                        aria-label="Letter spacing slider"
                      />
                      <span className="text-[10px] text-neutral-400 font-mono">+6px</span>
                    </div>

                    {/* Quick preset buttons */}
                    <div className="grid grid-cols-6 gap-1">
                      {[
                        { label: 'Tight', val: -1 },
                        { label: '0px', val: 0 },
                        { label: '+0.5', val: 0.5 },
                        { label: '+1px', val: 1 },
                        { label: '+2px', val: 2 },
                        { label: '+3.5', val: 3.5 },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.val}
                          onClick={() => onSetLetterSpacing?.(item.val)}
                          className={`py-1 text-[10px] font-medium border transition-colors ${
                            letterSpacing === item.val
                              ? 'border-neutral-900 bg-neutral-900 text-white'
                              : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
                          }`}
                          title={`Set letter spacing to ${item.val}px`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Line Spacing (Leading / Line Height) */}
                  <div className="space-y-2 p-3 bg-neutral-50/80 border border-neutral-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-neutral-800 flex items-center gap-1.5">
                        <MoveVertical className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Line Spacing (Leading)</span>
                      </label>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 bg-white border border-neutral-300 text-neutral-800 font-semibold">
                        {lineHeight.toFixed(2)}×
                        {lineHeight === 1.5 ? ' (Normal)' : ''}
                      </span>
                    </div>

                    {/* Slider */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400 font-mono">1.1×</span>
                      <input
                        type="range"
                        min="1.1"
                        max="2.4"
                        step="0.05"
                        value={lineHeight}
                        onChange={(e) => onSetLineHeight?.(Number(e.target.value))}
                        className="flex-1 accent-neutral-900 cursor-pointer h-1.5 bg-neutral-200"
                        aria-label="Line spacing slider"
                      />
                      <span className="text-[10px] text-neutral-400 font-mono">2.4×</span>
                    </div>

                    {/* Quick preset buttons */}
                    <div className="grid grid-cols-6 gap-1">
                      {[
                        { label: '1.2×', val: 1.2 },
                        { label: '1.35', val: 1.35 },
                        { label: '1.5×', val: 1.5 },
                        { label: '1.7×', val: 1.7 },
                        { label: '1.9×', val: 1.9 },
                        { label: '2.2×', val: 2.2 },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.val}
                          onClick={() => onSetLineHeight?.(item.val)}
                          className={`py-1 text-[10px] font-medium border transition-colors ${
                            Math.abs(lineHeight - item.val) < 0.02
                              ? 'border-neutral-900 bg-neutral-900 text-white'
                              : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
                          }`}
                          title={`Set line spacing to ${item.val}×`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: CANVAS THEME BACKGROUND SETTINGS                   */}
          {/* ========================================================= */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              {/* Canvas Preview Card */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                  <span>UI Canvas Preview</span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    {activeThemePreset ? activeThemePreset.name : 'Custom Color'} ({themeColor})
                  </span>
                </div>

                <div
                  className="p-4 border border-neutral-300 rounded-none shadow-inner transition-colors duration-150 flex items-center justify-center gap-3 min-h-[110px]"
                  style={{ backgroundColor: themeColor }}
                >
                  {/* Mini White Sticky Note Mockup */}
                  <div
                    className="w-36 bg-white border border-neutral-300 shadow-md p-2 text-xs flex flex-col gap-1 transition-transform hover:-translate-y-0.5"
                    style={{ color: '#171717' }}
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-neutral-200 text-[10px] text-neutral-500">
                      <span className="font-semibold text-neutral-900">White Note</span>
                      <span className="text-[9px]">#FFF</span>
                    </div>
                    <div className="space-y-1 text-[10px] leading-tight text-neutral-700">
                      <div className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3 text-neutral-900" />
                        <span>Independent note</span>
                      </div>
                    </div>
                  </div>

                  {/* Mini Yellow Sticky Note Mockup */}
                  <div
                    className="w-36 bg-[#fef08a] border border-amber-300 shadow-md p-2 text-xs flex flex-col gap-1 transition-transform hover:-translate-y-0.5"
                    style={{ color: '#171717' }}
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-amber-300 text-[10px] text-neutral-700">
                      <span className="font-semibold text-neutral-900">Canary Note</span>
                      <span className="text-[9px]">Custom</span>
                    </div>
                    <div className="space-y-1 text-[10px] leading-tight text-neutral-800">
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 border border-neutral-600 shrink-0" />
                        <span>Retains its color</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Curated Theme Palettes */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-neutral-700 block">
                  Curated Theme Palettes
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {themePresets.map((preset) => {
                    const isSelected =
                      normalizeHex(themeColor) === normalizeHex(preset.hex);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => onSelectThemeColor(preset.hex)}
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

              {/* Custom Theme Color Input */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-200">
                <span className="text-xs font-semibold text-neutral-700 block">
                  Custom Hex Background Color
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative w-9 h-8 border border-neutral-300 shrink-0 overflow-hidden cursor-pointer">
                    <input
                      type="color"
                      value={isValidHex(themeColor) ? normalizeHex(themeColor) : DEFAULT_THEME_COLOR}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomThemeInput(val.toUpperCase());
                        onSelectThemeColor(val);
                      }}
                      className="absolute inset-[-4px] w-[200%] h-[200%] cursor-pointer opacity-0"
                      title="Pick a custom canvas color"
                    />
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: themeColor }}
                    />
                  </div>

                  <input
                    type="text"
                    value={customThemeInput}
                    onChange={(e) => handleCustomThemeChange(e.target.value)}
                    placeholder="#FFFFFF"
                    maxLength={7}
                    className="flex-1 px-3 py-1.5 border border-neutral-300 text-xs font-mono text-neutral-800 uppercase focus:outline-neutral-900 bg-white"
                  />

                  <button
                    type="button"
                    onClick={onResetThemeColor}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 hover:bg-neutral-100 text-xs text-neutral-700 transition-colors shrink-0"
                    title="Reset to default white background (#FFFFFF)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Canvas, dock, and menus automatically adapt text contrast and borders ({isThemeDark ? 'Dark Mode active' : 'Light Mode active'}).
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOM MARKDOWN */}
          {activeTab === 'markdown' && (
            <CustomMarkdownSettingsTab
              rules={customMarkdownRules}
              onAddRule={(newRule) => {
                if (onAddCustomMarkdownRule) {
                  const created = onAddCustomMarkdownRule(newRule);
                  showStatus(`Added custom markdown "${newRule.name}"`);
                  return created;
                }
                return { ...newRule, id: `custom_${Date.now()}`, createdAt: Date.now() };
              }}
              onUpdateRule={(id, updates) => {
                onUpdateCustomMarkdownRule?.(id, updates);
              }}
              onDeleteRule={(id) => {
                onDeleteCustomMarkdownRule?.(id);
                showStatus('Deleted custom markdown rule');
              }}
              onDuplicateRule={(id) => {
                const dup = onDuplicateCustomMarkdownRule?.(id) || null;
                showStatus('Duplicated custom markdown rule');
                return dup;
              }}
              onResetRules={() => {
                onResetCustomMarkdownRules?.();
                showStatus('Reset custom markdown rules to default');
              }}
            />
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-200 bg-neutral-50/80 text-xs shrink-0">
          <div>
            {activeTab === 'notes' && (
              <button
                type="button"
                onClick={() => {
                  onResetNotePresets();
                  showStatus('Reset note colors to default');
                }}
                className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Note Colors</span>
              </button>
            )}

            {activeTab === 'font' && (
              <button
                type="button"
                onClick={() => {
                  onResetFontToDefault();
                  showStatus('Reset font to default');
                }}
                className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Font</span>
              </button>
            )}

            {activeTab === 'markdown' && (
              <button
                type="button"
                onClick={() => {
                  onResetCustomMarkdownRules?.();
                  showStatus('Reset custom markdown rules to default');
                }}
                className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Custom Markdown</span>
              </button>
            )}

            {activeTab === 'theme' && (
              <button
                type="button"
                onClick={() => {
                  onResetThemeColor();
                  showStatus('Reset canvas theme to default');
                }}
                className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Canvas</span>
              </button>
            )}
          </div>

          <button
            type="button"
            id="btn-settings-done"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white font-medium transition-colors"
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
