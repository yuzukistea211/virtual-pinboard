import React, { useState, useRef, useEffect } from 'react';
import {
  Trash2,
  GripHorizontal,
  Eye,
  PenLine,
  Bold,
  Italic,
  Heading,
  CheckSquare,
  List,
  Code,
  HelpCircle,
  X,
  Palette,
  Check,
  Highlighter,
} from 'lucide-react';
import { StickyNote, NoteColorPreset } from '../types';
import { MIN_NOTE_WIDTH, MIN_NOTE_HEIGHT, NOTE_COLOR_PRESETS } from '../constants';
import { MarkdownRenderer } from './MarkdownRenderer';
import { applyMarkdownFormat, toggleTaskInMarkdown, MarkdownFormatType } from '../utils/markdownUtils';
import { isColorDark, isValidHex, normalizeHex } from '../utils/themePresets';

interface StickyNoteCardProps {
  note: StickyNote;
  colorPresets?: NoteColorPreset[];
  highlightColor?: string;
  onOpenColorPresetsModal?: () => void;
  onUpdateContent: (id: string, text: string) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdateSize: (id: string, width: number, height: number) => void;
  onUpdateColor?: (id: string, color: string) => void;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void;
}

export const StickyNoteCard: React.FC<StickyNoteCardProps> = ({
  note,
  colorPresets,
  highlightColor,
  onOpenColorPresetsModal,
  onUpdateContent,
  onUpdatePosition,
  onUpdateSize,
  onUpdateColor,
  onDelete,
  onBringToFront,
}) => {
  // If content is empty, default to edit mode; otherwise, default to markdown preview mode
  const [isEditing, setIsEditing] = useState(() => !note.content || note.content.trim() === '');
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const activePresets = colorPresets && colorPresets.length > 0 ? colorPresets : NOTE_COLOR_PRESETS;
  const noteColor = note.color || '#ffffff';
  const isDark = isColorDark(noteColor);
  const [customHexInput, setCustomHexInput] = useState<string>(noteColor);

  useEffect(() => {
    setCustomHexInput(noteColor);
  }, [noteColor]);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [localPos, setLocalPos] = useState({ x: note.x, y: note.y });
  const [localSize, setLocalSize] = useState({
    width: note.width || 250,
    height: note.height || 210,
  });

  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const resizeStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync external position updates if not currently dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalPos({ x: note.x, y: note.y });
    }
  }, [note.x, note.y, isDragging]);

  // Sync external size updates if not currently resizing
  useEffect(() => {
    if (!isResizing) {
      setLocalSize({
        width: note.width || 250,
        height: note.height || 210,
      });
    }
  }, [note.width, note.height, isResizing]);

  // Auto-focus textarea and place cursor at end when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const lastClickRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });

  // Handle double-click to write/edit across any part of the note
  const handleStartWriting = (e?: React.MouseEvent) => {
    if (e) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.tagName === 'INPUT' ||
        target.closest('input') ||
        target.tagName === 'A' ||
        target.closest('a')
      ) {
        return;
      }
      e.stopPropagation();
    }
    setIsEditing(true);
  };

  // Dragging logic
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;

    // Do not initiate note drag if clicking inside interactive elements or content
    if (
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'A' ||
      target.closest('button') ||
      target.closest('[data-no-drag="true"]') ||
      target.closest('[data-resize-handle="true"]') ||
      target.closest('.markdown-body') ||
      target.closest('.note-content-area')
    ) {
      return;
    }

    onBringToFront(note.id);

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: localPos.x,
      startY: localPos.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.pointerX;
    const deltaY = e.clientY - dragStartRef.current.pointerY;

    // Only start actual drag when moved more than 3px threshold
    if (!isDragging && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
      setIsDragging(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // safe fallback
      }
    }

    if (!isDragging) return;

    e.preventDefault();
    const newX = Math.max(0, dragStartRef.current.startX + deltaX);
    const newY = Math.max(0, dragStartRef.current.startY + deltaY);

    setLocalPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;

    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // safe fallback
      }

      const deltaX = e.clientX - dragStartRef.current.pointerX;
      const deltaY = e.clientY - dragStartRef.current.pointerY;
      const finalX = Math.max(0, Math.round(dragStartRef.current.startX + deltaX));
      const finalY = Math.max(0, Math.round(dragStartRef.current.startY + deltaY));

      onUpdatePosition(note.id, finalX, finalY);
      setIsDragging(false);
    } else {
      // It was a stationary click/tap! Track double click manually as well
      const now = Date.now();
      const timeDiff = now - lastClickRef.current.time;
      const dist = Math.hypot(e.clientX - lastClickRef.current.x, e.clientY - lastClickRef.current.y);

      if (timeDiff < 350 && dist < 25) {
        handleStartWriting();
        lastClickRef.current = { time: 0, x: 0, y: 0 };
      } else {
        lastClickRef.current = { time: now, x: e.clientX, y: e.clientY };
      }
    }

    dragStartRef.current = null;
  };

  // Resizing logic
  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    onBringToFront(note.id);
    setIsResizing(true);

    const targetEl = e.currentTarget;
    targetEl.setPointerCapture(e.pointerId);

    resizeStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startWidth: localSize.width,
      startHeight: localSize.height,
    };
  };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing || !resizeStartRef.current) return;

    const deltaX = e.clientX - resizeStartRef.current.pointerX;
    const deltaY = e.clientY - resizeStartRef.current.pointerY;

    const newW = Math.max(MIN_NOTE_WIDTH, resizeStartRef.current.startWidth + deltaX);
    const newH = Math.max(MIN_NOTE_HEIGHT, resizeStartRef.current.startHeight + deltaY);

    setLocalSize({ width: newW, height: newH });
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }

    setIsResizing(false);

    if (resizeStartRef.current) {
      const deltaX = e.clientX - resizeStartRef.current.pointerX;
      const deltaY = e.clientY - resizeStartRef.current.pointerY;
      const finalW = Math.max(MIN_NOTE_WIDTH, Math.round(resizeStartRef.current.startWidth + deltaX));
      const finalH = Math.max(MIN_NOTE_HEIGHT, Math.round(resizeStartRef.current.startHeight + deltaY));

      onUpdateSize(note.id, finalW, finalH);
    }

    resizeStartRef.current = null;
  };

  // Format insertion helper
  const handleFormat = (type: MarkdownFormatType) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selStart = textarea.selectionStart ?? 0;
    const selEnd = textarea.selectionEnd ?? 0;

    const { newText, newCursorStart, newCursorEnd } = applyMarkdownFormat(
      note.content,
      selStart,
      selEnd,
      type
    );

    onUpdateContent(note.id, newText);

    // Re-focus and set selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    }, 0);
  };

  // Handle keyboard shortcuts in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      handleFormat('bold');
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      handleFormat('italic');
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'h' || e.key === 'H')) {
      e.preventDefault();
      handleFormat('highlight');
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const selStart = textarea.selectionStart;
      const selEnd = textarea.selectionEnd;
      const newText =
        note.content.substring(0, selStart) + '  ' + note.content.substring(selEnd);
      onUpdateContent(note.id, newText);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selStart + 2;
      }, 0);
    }
  };

  // Toggle checklist checkbox from preview
  const handleToggleTask = (taskIndex: number) => {
    const updated = toggleTaskInMarkdown(note.content, taskIndex);
    onUpdateContent(note.id, updated);
  };

  return (
    <div
      id={`note-${note.id}`}
      style={{
        transform: `translate3d(${localPos.x}px, ${localPos.y}px, 0)`,
        width: `${localSize.width}px`,
        height: `${localSize.height}px`,
        zIndex: note.zIndex,
        backgroundColor: noteColor,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.12)',
        color: isDark ? '#f8fafc' : '#1e293b',
      }}
      className={`sticky-note-card absolute top-0 left-0 border rounded-none shadow-xs transition-shadow duration-100 flex flex-col select-none group ${
        isDragging
          ? 'shadow-xl ring-1 ring-neutral-400 cursor-grabbing'
          : isResizing
          ? 'shadow-md ring-1 ring-neutral-400 cursor-nwse-resize'
          : 'hover:shadow-md'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={() => onBringToFront(note.id)}
      onDoubleClick={handleStartWriting}
    >
      {/* Top note bar: Drag grip, Mode Toggle (Edit / Preview), Color Variation, Cheatsheet, Delete button */}
      <div
        className="flex items-center justify-between px-2 py-1 border-b cursor-grab active:cursor-grabbing"
        onDoubleClick={handleStartWriting}
        style={{
          backgroundColor: noteColor,
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
        }}
      >
        <div className="flex items-center gap-1.5 text-neutral-400">
          <GripHorizontal className="w-3.5 h-3.5" style={{ color: isDark ? '#94a3b8' : '#94a3b8' }} />

          {/* Mode Switcher Button: Edit <-> Preview */}
          <button
            type="button"
            id={`toggle-mode-btn-${note.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className={`flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
              isEditing
                ? isDark
                  ? 'bg-white text-neutral-900 hover:bg-neutral-200'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800'
                : isDark
                ? 'bg-white/10 text-neutral-200 hover:bg-white/20'
                : 'bg-black/5 text-neutral-700 hover:bg-black/10'
            }`}
            title={isEditing ? 'View rendered Markdown (Esc)' : 'Edit Markdown note'}
          >
            {isEditing ? (
              <>
                <Eye className="w-3 h-3" />
              </>
            ) : (
              <>
                <PenLine className="w-3 h-3" />
              </>
            )}
          </button>

          {/* Note Color Picker with Custom Color Variation */}
          <div className="relative">
            <button
              type="button"
              id={`color-picker-btn-${note.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
                setShowCheatsheet(false);
              }}
              className={`flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium border transition-colors ${
                isDark
                  ? 'border-white/20 hover:bg-white/10 text-neutral-200'
                  : 'border-black/10 hover:bg-black/5 text-neutral-700'
              }`}
              title="Change note color & custom color variation"
            >
              <Palette className="w-3 h-3" />
            </button>

            {/* Note Color Palette Popover */}
            {showColorPicker && (
              <div
                data-no-drag="true"
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-6 z-50 w-64 bg-white text-neutral-800 border border-neutral-300 shadow-xl p-3 text-[11px] space-y-2.5 select-text rounded-none"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
                  <span className="font-semibold text-xs text-neutral-900">
                    Note Color Variation
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(false)}
                    className="p-0.5 text-neutral-400 hover:text-neutral-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Color Swatches Grid */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider block">
                      Presets
                    </span>
                    {onOpenColorPresetsModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowColorPicker(false);
                          onOpenColorPresetsModal();
                        }}
                        className="text-[10px] text-neutral-600 hover:text-neutral-950 flex items-center gap-1 font-medium hover:underline transition-colors"
                        title="Change or customize note color presets"
                      >
                        <Palette className="w-2.5 h-2.5" />
                        <span>Edit Presets</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 max-h-[120px] overflow-y-auto pr-0.5">
                    {activePresets.map((preset) => {
                      const isSelected =
                        normalizeHex(noteColor) === normalizeHex(preset.hex);
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            if (onUpdateColor) {
                              onUpdateColor(note.id, preset.hex);
                            }
                            setShowColorPicker(false);
                          }}
                          className={`relative w-7 h-7 rounded-none border transition-transform hover:scale-105 flex items-center justify-center ${
                            isSelected
                              ? 'ring-2 ring-neutral-900 border-transparent'
                              : 'border-neutral-300 hover:border-neutral-500'
                          }`}
                          style={{ backgroundColor: preset.hex }}
                          title={preset.name}
                        >
                          {isSelected && (
                            <Check
                              className={`w-3 h-3 ${
                                preset.isDark ? 'text-white' : 'text-neutral-900'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Color Variation Input */}
                <div className="pt-2 border-t border-neutral-200 space-y-1.5">
                  <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider block">
                    Custom Hex Color
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Native color picker box */}
                    <div className="relative w-7 h-7 border border-neutral-300 shrink-0 overflow-hidden cursor-pointer">
                      <input
                        type="color"
                        value={isValidHex(noteColor) ? normalizeHex(noteColor) : '#FFFFFF'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomHexInput(val.toUpperCase());
                          if (onUpdateColor) {
                            onUpdateColor(note.id, val);
                          }
                        }}
                        className="absolute inset-[-4px] w-[200%] h-[200%] cursor-pointer opacity-0"
                        title="Pick custom note color"
                      />
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: noteColor }}
                      />
                    </div>

                    {/* Text input */}
                    <input
                      type="text"
                      value={customHexInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomHexInput(val);
                        if (isValidHex(val) && onUpdateColor) {
                          onUpdateColor(note.id, normalizeHex(val));
                        }
                      }}
                      placeholder="#FFFFFF"
                      maxLength={7}
                      className="flex-1 px-2 py-1 border border-neutral-300 bg-neutral-50 text-[11px] font-mono uppercase text-neutral-800 focus:outline-neutral-900"
                    />

                    {/* Reset note color to white */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateColor) {
                          onUpdateColor(note.id, '#ffffff');
                        }
                        setCustomHexInput('#FFFFFF');
                      }}
                      className="px-1.5 py-1 border border-neutral-200 hover:bg-neutral-100 text-[10px] text-neutral-600"
                      title="Reset note to Crisp White"
                    >
                      White
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Markdown formatting guide toggle */}
          <div className="relative">
            <button
              type="button"
              id={`cheatsheet-btn-${note.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowCheatsheet(!showCheatsheet);
                setShowColorPicker(false);
              }}
              className={`p-0.5 transition-colors ${
                showCheatsheet
                  ? isDark ? 'text-white bg-white/20' : 'text-neutral-900 bg-neutral-100'
                  : isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
              }`}
              title="Markdown syntax reference"
              aria-label="Markdown syntax reference"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Compact Markdown Cheat-sheet Dropdown */}
            {showCheatsheet && (
              <div
                data-no-drag="true"
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-6 z-50 w-56 bg-white border border-neutral-300 shadow-lg p-2.5 text-[11px] text-neutral-700 space-y-1.5 select-text"
              >
                <div className="flex items-center justify-between pb-1 border-b border-neutral-200">
                  <span className="font-semibold text-neutral-900 text-xs">Markdown Syntax</span>
                  <button
                    type="button"
                    onClick={() => setShowCheatsheet(false)}
                    className="p-0.5 text-neutral-400 hover:text-neutral-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1 text-neutral-600 font-mono text-[10px]">
                  <p><span className="text-neutral-900 font-semibold">#</span> Header 1</p>
                  <p><span className="text-neutral-900 font-semibold">###</span> Header 3</p>
                  <p><span className="text-neutral-900 font-semibold">**bold**</span> text</p>
                  <p><span className="text-neutral-900 font-semibold">*italic*</span> text</p>
                  <p><span className="text-neutral-900 font-semibold">==highlight==</span> Highlight text</p>
                  <p><span className="text-neutral-900 font-semibold">- [ ]</span> Checkbox task</p>
                  <p><span className="text-neutral-900 font-semibold">-</span> Bullet list</p>
                  <p><span className="text-neutral-900 font-semibold">`code`</span> inline block</p>
                  <p><span className="text-neutral-900 font-semibold">&gt;</span> Blockquote</p>
                  <p><span className="text-neutral-900 font-semibold">***</span> Horizontal Rule</p>
                  <p><span className="text-neutral-900 font-semibold">~~Strikethrough~~</span> text</p>
                </div>
                <div className="pt-1 border-t border-neutral-100 text-[9px] text-neutral-400">
                  Double-click note to edit. Esc to preview.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete note button */}
        <button
          type="button"
          id={`delete-btn-${note.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="p-0.5 text-neutral-400 hover:text-red-500 hover:bg-neutral-100/30 opacity-0 group-hover:opacity-100 transition-all duration-150"
          title="Delete note"
          aria-label="Delete note"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Note Content Area */}
      <div
        className="note-content-area relative flex-1 p-2.5 overflow-hidden flex flex-col cursor-text"
        onDoubleClick={handleStartWriting}
      >
        {isEditing ? (
          <div className="w-full h-full flex flex-col" data-no-drag="true">
            {/* Mini Markdown Toolbar */}
            <div
              className="flex items-center gap-0.5 pb-1.5 mb-1.5 border-b"
              style={{
                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                color: isDark ? '#cbd5e1' : '#475569',
              }}
            >
              <button
                type="button"
                onClick={() => handleFormat('bold')}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Bold (**text**)"
              >
                <Bold className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleFormat('italic')}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Italic (*text*)"
              >
                <Italic className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleFormat('highlight')}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Highlight (==text==) [Ctrl+H]"
              >
                <Highlighter className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              </button>
              <button
                type="button"
                onClick={() => handleFormat('heading')}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Header (### Title)"
              >
                <Heading className="w-3 h-3" />
              </button>
              <div
                className="w-px h-3 mx-0.5"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }}
              />
              <button
                type="button"
                onClick={() => handleFormat('task')}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Checklist (- [ ] Task)"
              >
                <CheckSquare className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleFormat('list')}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Bullet List (- item)"
              >
                <List className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleFormat('code')}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Code (`code`)"
              >
                <Code className="w-3 h-3" />
              </button>
            </div>

            {/* Markdown Source Textarea */}
            <textarea
              ref={textareaRef}
              id={`textarea-${note.id}`}
              value={note.content}
              onChange={(e) => onUpdateContent(note.id, e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => onBringToFront(note.id)}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              placeholder="Write in Markdown (# header, - [ ] task, **bold**)..."
              style={{
                fontFamily: 'inherit',
                fontSize: 'calc(0.75rem * var(--app-font-scale, 1))',
                lineHeight: 'var(--app-line-height, 1.5)',
                letterSpacing: 'var(--app-letter-spacing, 0px)',
                color: isDark ? '#f8fafc' : '#1e293b',
                caretColor: isDark ? '#f8fafc' : '#1e293b',
              }}
              className="w-full flex-1 bg-transparent resize-none border-none outline-hidden text-xs leading-relaxed placeholder-neutral-400 select-text cursor-text"
            />
          </div>
        ) : (
          /* Rendered Markdown Preview */
          <div
            className="w-full h-full cursor-text"
            onDoubleClick={handleStartWriting}
            title="Double-click to edit Markdown"
          >
            <MarkdownRenderer
              content={note.content}
              onToggleTask={handleToggleTask}
              onDoubleClick={handleStartWriting}
              isDark={isDark}
              highlightColor={highlightColor}
            />
          </div>
        )}
      </div>

      {/* Resize Handle at the bottom-right corner */}
      <div
        data-resize-handle="true"
        id={`resize-handle-${note.id}`}
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        onPointerCancel={handleResizePointerUp}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-0.5 z-20 group/resize"
        title="Drag to resize note"
      >
        <svg
          viewBox="0 0 10 10"
          className="w-2.5 h-2.5 text-neutral-400 group-hover/resize:text-neutral-800 transition-colors pointer-events-none"
        >
          <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" />
          <line x1="9" y1="5" x2="5" y2="9" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
};
