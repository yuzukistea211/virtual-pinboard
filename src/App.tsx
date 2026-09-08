/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { usePinboard } from './hooks/usePinboard';
import { StickyNoteCard } from './components/StickyNoteCard';
import { MinimalDock } from './components/MinimalDock';
import { BoardSwitcher } from './components/BoardSwitcher';
import { DEFAULT_NOTE_WIDTH, DEFAULT_NOTE_HEIGHT } from './constants';
import { FileText } from 'lucide-react';

export default function App() {
  const {
    boards,
    activeBoard,
    activeBoardId,
    notes,
    lastSaved,
    selectBoard,
    createBoard,
    renameBoard,
    deleteBoard,
    duplicateBoard,
    addNote,
    updateNoteContent,
    updateNotePosition,
    updateNoteSize,
    bringToFront,
    deleteNote,
    clearBoard,
    exportBoardJSON,
    importBoardJSON,
  } = usePinboard();

  const canvasRef = useRef<HTMLDivElement>(null);

  // Drag-to-add note state
  const [isDraggingNewNote, setIsDraggingNewNote] = useState(false);
  const [ghostPos, setGhostPos] = useState<{ clientX: number; clientY: number }>({ clientX: 0, clientY: 0 });

  const handleStartDragNewNote = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDraggingNewNote(true);
    setGhostPos({ clientX: e.clientX, clientY: e.clientY });
  };

  useEffect(() => {
    if (!isDraggingNewNote) return;

    const handlePointerMove = (e: PointerEvent) => {
      setGhostPos({ clientX: e.clientX, clientY: e.clientY });
    };

    const handlePointerUp = (e: PointerEvent) => {
      setIsDraggingNewNote(false);

      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const scrollLeft = canvasRef.current.scrollLeft;
      const scrollTop = canvasRef.current.scrollTop;

      // Position new note centered on cursor or aligned near top-left of note
      const dropX = Math.max(10, e.clientX - rect.left + scrollLeft - DEFAULT_NOTE_WIDTH / 2);
      const dropY = Math.max(10, e.clientY - rect.top + scrollTop - 20);

      addNote(dropX, dropY, DEFAULT_NOTE_WIDTH, DEFAULT_NOTE_HEIGHT);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDraggingNewNote, addNote]);

  return (
    <main
      ref={canvasRef}
      id="canvas-container"
      className="relative w-screen h-screen overflow-auto bg-white select-none cursor-default"
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* Top Header: Brand & Pinboard Selector */}
      <header className="fixed top-3 left-4 z-40 flex items-center gap-3 select-none">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase pointer-events-none">
            Pinboard
          </h1>
          <span className="text-neutral-300 font-light text-sm pointer-events-none">/</span>
          <div className="pointer-events-auto">
            <BoardSwitcher
              boards={boards}
              activeBoard={activeBoard}
              activeBoardId={activeBoardId}
              onSelectBoard={selectBoard}
              onCreateBoard={createBoard}
              onRenameBoard={renameBoard}
              onDeleteBoard={deleteBoard}
              onDuplicateBoard={duplicateBoard}
              onExportAll={() => exportBoardJSON(true)}
            />
          </div>
        </div>
        <span className="hidden md:inline-block text-[11px] text-neutral-400 font-normal pointer-events-none ml-1">
          Drag &ldquo;+ Drag Note&rdquo; onto canvas &bull; Markdown supported
        </span>
      </header>

      {/* Empty State when no notes are on the current board */}
      {notes.length === 0 && (
        <div
          id="empty-state-canvas"
          className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none"
        >
          <div className="w-12 h-12 border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-sm text-neutral-600 font-medium">
            &ldquo;{activeBoard.name}&rdquo; is empty.
          </p>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm">
            Drag the <span className="font-semibold text-neutral-700">+ Drag Note</span> element from the bottom toolbar onto the canvas to add your first note.
          </p>
        </div>
      )}

      {/* Interactive Sticky Notes Layer */}
      <div id="notes-layer" className="relative min-w-full min-h-full">
        {notes.map((note) => (
          <StickyNoteCard
            key={note.id}
            note={note}
            onUpdateContent={updateNoteContent}
            onUpdatePosition={updateNotePosition}
            onUpdateSize={updateNoteSize}
            onDelete={deleteNote}
            onBringToFront={bringToFront}
          />
        ))}
      </div>

      {/* Floating Ghost Note when dragging to add a new note */}
      {isDraggingNewNote && (
        <div
          id="ghost-note-preview"
          style={{
            position: 'fixed',
            left: `${ghostPos.clientX - DEFAULT_NOTE_WIDTH / 2}px`,
            top: `${ghostPos.clientY - 20}px`,
            width: `${DEFAULT_NOTE_WIDTH}px`,
            height: `${DEFAULT_NOTE_HEIGHT}px`,
            zIndex: 9999,
          }}
          className="pointer-events-none bg-white/95 border-2 border-dashed border-neutral-700 shadow-2xl rounded-none flex flex-col p-3 transition-none opacity-90 scale-100"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200">
            <span className="text-[11px] font-medium text-neutral-600">New Markdown Note</span>
            <span className="text-[10px] text-neutral-400">Drop anywhere</span>
          </div>
          <div className="flex-1 flex items-center justify-center text-xs text-neutral-400 italic">
            Release to place note here
          </div>
        </div>
      )}

      {/* Floating Minimal Toolbar */}
      <MinimalDock
        noteCount={notes.length}
        boardName={activeBoard.name}
        lastSaved={lastSaved}
        onStartDragNewNote={handleStartDragNewNote}
        onExport={() => exportBoardJSON(false)}
        onImport={importBoardJSON}
        onClear={clearBoard}
        isDraggingNewNote={isDraggingNewNote}
      />
    </main>
  );
}

