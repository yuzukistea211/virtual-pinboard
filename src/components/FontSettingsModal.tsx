import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Type,
  X,
  Upload,
  Globe,
  Trash2,
  Check,
  RotateCcw,
  FileCode,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { FontOption, FontApplyScope } from '../types';

interface FontSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFont: FontOption;
  presetFonts: FontOption[];
  customFonts: FontOption[];
  applyScope: FontApplyScope;
  sizeScale: number;
  onSelectFont: (fontId: string) => void;
  onSetApplyScope: (scope: FontApplyScope) => void;
  onSetSizeScale: (scale: number) => void;
  onImportLocalFont: (file: File, customName?: string) => Promise<{ success: boolean; font?: FontOption; error?: string }>;
  onImportWebFont: (fontNameOrUrl: string, customName?: string) => Promise<{ success: boolean; font?: FontOption; error?: string }>;
  onRemoveCustomFont: (fontId: string) => Promise<void>;
  onResetToDefault: () => void;
}

export const FontSettingsModal: React.FC<FontSettingsModalProps> = ({
  isOpen,
  onClose,
  activeFont,
  presetFonts,
  customFonts,
  applyScope,
  sizeScale,
  onSelectFont,
  onSetApplyScope,
  onSetSizeScale,
  onImportLocalFont,
  onImportWebFont,
  onRemoveCustomFont,
  onResetToDefault,
}) => {
  // Tabs: 'presets' | 'import-file' | 'import-web'
  const [activeTab, setActiveTab] = useState<'presets' | 'import-file' | 'import-web'>('presets');

  // Live test word input
  const [testWords, setTestWords] = useState<string>('The quick brown fox jumps over the lazy dog.');

  // File import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFileFontName, setCustomFileFontName] = useState('');
  const [fileImportError, setFileImportError] = useState<string | null>(null);
  const [isImportingFile, setIsImportingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Web / Google font import state
  const [webFontInput, setWebFontInput] = useState('');
  const [customWebFontName, setCustomWebFontName] = useState('');
  const [webImportError, setWebImportError] = useState<string | null>(null);
  const [isImportingWeb, setIsImportingWeb] = useState(false);

  // Success message toast
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Close on Escape key press
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

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

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
      setActiveTab('presets');
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
      setActiveTab('presets');
    } else {
      setWebImportError(res.error || 'Failed to import font');
    }
  };

  const modalContent = (
    <div
      id="font-settings-backdrop"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/25 select-none transition-all duration-150 animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="font-settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Font and Typography Settings"
        onClick={(e) => e.stopPropagation()}
        className="relative z-[10001] w-full max-w-2xl max-h-[90vh] theme-ui-bg border border-neutral-300 shadow-2xl flex flex-col overflow-hidden text-neutral-900 animate-in zoom-in-95 duration-150"
        style={{ backgroundColor: 'var(--ui-bg, var(--theme-bg, #ffffff))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-neutral-900 text-white flex items-center justify-center">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-neutral-900">
                Interface Typography & Word Font
              </h2>
              <p className="text-[11px] text-neutral-500">
                Customize the font for all notes and UI, or import your own font
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status notification toast */}
          {statusMessage && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

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
              className="p-3 bg-white border border-neutral-200 min-h-[64px] flex items-center transition-all select-text"
              style={{
                fontFamily: activeFont.fontFamily,
                fontSize: `${13 * (sizeScale / 100)}px`,
                lineHeight: 1.5,
              }}
            >
              <span className="text-neutral-900 break-words w-full">
                {testWords || 'Type your words to test font rendering...'}
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
                onClick={() => setTestWords('Pinboard: Organize ideas with Markdown notes')}
                className="px-2 py-1.5 text-[11px] text-neutral-600 bg-white border border-neutral-300 hover:bg-neutral-100 transition-colors whitespace-nowrap"
              >
                Sample 1
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
              onClick={() => setActiveTab('presets')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'presets'
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
              onClick={() => setActiveTab('import-file')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'import-file'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Font File</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('import-web')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'import-web'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Import Web Font / CSS</span>
            </button>
          </div>

          {/* Tab 1: Presets & Custom List */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              {/* Custom Imported Fonts Section (if any exist) */}
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
                <span className="text-xs font-semibold text-neutral-800">Curated Presets</span>
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
                              className={`text-[9px] px-1 py-0.2 capitalize ${
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
                            Sample text: Sticky notes & words
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

          {/* Tab 2: Upload Local Font File */}
          {activeTab === 'import-file' && (
            <form onSubmit={handleSubmitFileImport} className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${
                  selectedFile
                    ? 'border-neutral-900 bg-neutral-50'
                    : 'border-neutral-300 hover:border-neutral-600 bg-neutral-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="w-9 h-9 bg-neutral-100 text-neutral-700 flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                {selectedFile ? (
                  <div>
                    <p className="text-xs font-semibold text-neutral-900">{selectedFile.name}</p>
                    <p className="text-[11px] text-neutral-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click to choose different file
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-medium text-neutral-800">
                      Drag and drop your font file here, or <span className="underline">browse</span>
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Supports TrueType (.ttf), OpenType (.otf), and Web Open (.woff, .woff2) up to 50MB
                    </p>
                  </div>
                )}
              </div>

              {fileImportError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 p-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fileImportError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700 block">
                  Font Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={customFileFontName}
                  onChange={(e) => setCustomFileFontName(e.target.value)}
                  placeholder="e.g. My Favorite Handwritten Font"
                  className="w-full px-3 py-1.5 border border-neutral-300 text-xs text-neutral-800 focus:outline-neutral-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setCustomFileFontName('');
                    setActiveTab('presets');
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
                  {isImportingFile ? (
                    <span>Registering font...</span>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Install & Use Font</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Google / Web Font / CSS Import */}
          {activeTab === 'import-web' && (
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
                  className="w-full px-3 py-1.5 border border-neutral-300 text-xs text-neutral-800 focus:outline-neutral-900 font-mono"
                />
                <p className="text-[11px] text-neutral-500 leading-normal">
                  Paste any CSS font URL (ZeoSeven, Google Fonts, CDN), an{' '}
                  <code className="font-mono text-[10px] bg-neutral-100 px-1 py-0.5 border border-neutral-200 text-neutral-700">
                    @import url(...)
                  </code>{' '}
                  statement, or a Google Font name. The declared font-family will be automatically detected.
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
                  className="w-full px-3 py-1.5 border border-neutral-300 text-xs text-neutral-800 focus:outline-neutral-900"
                />
                <p className="text-[11px] text-neutral-400">
                  Leave empty to automatically use the font&apos;s official declared family name (e.g. &quot;BabelStone Han&quot;).
                </p>
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
                    setActiveTab('presets');
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
                  {isImportingWeb ? (
                    <span>Fetching font...</span>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      <span>Fetch & Apply Font</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Configuration Options: Scope & Text Scaling */}
          <div className="pt-3 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Scope */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-neutral-500" />
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
                <label className="text-xs font-semibold text-neutral-800">
                  Text Size Scale:
                </label>
                <span className="text-[11px] font-mono px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-800 font-semibold">
                  {sizeScale}%
                </span>
              </div>
              
              {/* Slider for smooth adjustment */}
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
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-200 bg-neutral-50/70 text-xs">
          <button
            type="button"
            onClick={onResetToDefault}
            className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Default Font</span>
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
