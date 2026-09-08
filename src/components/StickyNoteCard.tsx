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
} from 'lucide-react';
import { StickyNote } from '../types';
import { MIN_NOTE_WIDTH, MIN_NOTE_HEIGHT } from '../constants';
import { MarkdownRenderer } from './MarkdownRenderer';
import { applyMarkdownFormat, toggleTaskInMarkdown, MarkdownFormatType } from '../utils/markdownUtils';

interface StickyNoteCardProps {
  note: StickyNote;
  onUpdateContent: (id: string, text: string) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdateSize: (id: string, width: number, height: number) => void;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void;
}

export const StickyNoteCard: React.FC<StickyNoteCardProps> = ({
  note,
  onUpdateContent,
  onUpdatePosition,
  onUpdateSize,
  onDelete,
  onBringToFront,
}) => {
  // If content is empty, default to edit mode; otherwise, default to markdown preview mode
  const [isEditing, setIsEditing] = useState(() => !note.content || note.content.trim() === '');
  const [showCheatsheet, setShowCheatsheet] = useState(false);

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

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // Dragging logic
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Do not initiate note drag if clicking inside textarea, buttons, inputs, links, or resize handle
    if (
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'A' ||
      target.closest('button') ||
      target.closest('[data-no-drag="true"]') ||
      target.closest('[data-resize-handle="true"]') ||
      target.closest('.markdown-body')
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    onBringToFront(note.id);
    setIsDragging(true);

    const targetEl = e.currentTarget;
    targetEl.setPointerCapture(e.pointerId);

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: localPos.x,
      startY: localPos.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.pointerX;
    const deltaY = e.clientY - dragStartRef.current.pointerY;

    const newX = Math.max(0, dragStartRef.current.startX + deltaX);
    const newY = Math.max(0, dragStartRef.current.startY + deltaY);

    setLocalPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }

    setIsDragging(false);

    if (dragStartRef.current) {
      const deltaX = e.clientX - dragStartRef.current.pointerX;
      const deltaY = e.clientY - dragStartRef.current.pointerY;
      const finalX = Math.max(0, Math.round(dragStartRef.current.startX + deltaX));
      const finalY = Math.max(0, Math.round(dragStartRef.current.startY + deltaY));

      onUpdatePosition(note.id, finalX, finalY);
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
        backgroundColor: 'var(--theme-bg, #ffffff)',
      }}
      className={`sticky-note-card absolute top-0 left-0 theme-ui-bg border border-neutral-300 rounded-none shadow-xs transition-shadow duration-100 flex flex-col select-none group ${
        isDragging
          ? 'shadow-xl ring-1 ring-neutral-400 cursor-grabbing'
          : isResizing
          ? 'shadow-md ring-1 ring-neutral-400 cursor-nwse-resize'
          : 'hover:shadow-md hover:border-neutral-400'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={() => onBringToFront(note.id)}
    >
      {/* Top note bar: Drag grip, Mode Toggle (Edit / Preview), Cheatsheet, Delete button */}
      <div
        className="flex items-center justify-between px-2 py-1 border-b border-neutral-200 theme-ui-bg cursor-grab active:cursor-grabbing"
        style={{ backgroundColor: 'var(--theme-bg, #ffffff)' }}
      >
        <div className="flex items-center gap-1.5 text-neutral-400">
          <GripHorizontal className="w-3.5 h-3.5" />

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
                ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
            title={isEditing ? 'View rendered Markdown (Esc)' : 'Edit Markdown note'}
          >
            {isEditing ? (
              <>
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </>
            ) : (
              <>
                <PenLine className="w-3 h-3" />
                <span>Edit</span>
              </>
            )}
          </button>

          {/* Markdown formatting guide toggle */}
          <div className="relative">
            <button
              type="button"
              id={`cheatsheet-btn-${note.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowCheatsheet(!showCheatsheet);
              }}
              className={`p-0.5 transition-colors ${
                showCheatsheet
                  ? 'text-neutral-900 bg-neutral-100'
                  : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
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
                className="absolute left-0 top-6 z-50 w-56 theme-ui-bg border border-neutral-300 shadow-lg p-2.5 text-[11px] text-neutral-700 space-y-1.5 select-text"
                style={{ backgroundColor: 'var(--theme-bg, #ffffff)' }}
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
                  <p><span className="text-neutral-900 font-semibold">- [ ]</span> Checkbox task</p>
                  <p><span className="text-neutral-900 font-semibold">-</span> Bullet list</p>
                  <p><span className="text-neutral-900 font-semibold">`code`</span> inline block</p>
                  <p><span className="text-neutral-900 font-semibold">&gt;</span> Blockquote</p>
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
          className="p-0.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 opacity-0 group-hover:opacity-100 transition-all duration-150"
          title="Delete note"
          aria-label="Delete note"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Note Content Area */}
      <div className="relative flex-1 p-2.5 overflow-hidden flex flex-col">
        {isEditing ? (
          <div className="w-full h-full flex flex-col" data-no-drag="true">
            {/* Mini Markdown Toolbar */}
            <div className="flex items-center gap-0.5 pb-1.5 mb-1.5 border-b border-neutral-100 text-neutral-600">
              <button
                type="button"
                onClick={() => handleFormat('bold')}
                className="p-1 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                title="Bold (**text**)"
              >
                <Bold className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleFormat('italic')}
                className="p-1 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                title="Italic (*text*)"
              >
                <Italic className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleFormat('heading')}
                className="p-1 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                title="Header (### Title)"
              >
                <Heading className="w-3 h-3" />
              </button>
              <div className="w-px h-3 bg-neutral-200 mx-0.5" />
              <button
                type="button"
                onClick={() => handleFormat('task')}
                className="p-1 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                title="Checklist (- [ ] Task)"
              >
                <CheckSquare className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleFormat('list')}
                className="p-1 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                title="Bullet List (- item)"
              >
                <List className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleFormat('code')}
                className="p-1 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
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
              style={{ fontFamily: 'inherit' }}
              className="w-full flex-1 bg-transparent resize-none border-none outline-hidden text-xs leading-relaxed text-neutral-800 placeholder-neutral-400 select-text cursor-text"
            />
          </div>
        ) : (
          /* Rendered Markdown Preview */
          <div
            className="w-full h-full cursor-text"
            onDoubleClick={() => setIsEditing(true)}
            title="Double-click to edit Markdown"
          >
            <MarkdownRenderer
              content={note.content}
              onToggleTask={handleToggleTask}
              onDoubleClick={() => setIsEditing(true)}
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
