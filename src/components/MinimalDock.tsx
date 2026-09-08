import React, { useRef, useState } from 'react';
import { Download, Upload, Trash2, Check, FileText } from 'lucide-react';

interface MinimalDockProps {
  noteCount: number;
  lastSaved: number;
  onStartDragNewNote: (e: React.PointerEvent<HTMLDivElement>) => void;
  onExport: () => void;
  onImport: (file: File) => Promise<{ success: boolean; count?: number; error?: string }>;
  onClear: () => void;
  isDraggingNewNote?: boolean;
}

export const MinimalDock: React.FC<MinimalDockProps> = ({
  noteCount,
  onStartDragNewNote,
  onExport,
  onImport,
  onClear,
  isDraggingNewNote,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await onImport(file);
    if (res.success) {
      setImportStatus(`Loaded ${res.count ?? 0} notes`);
    } else {
      setImportStatus(res.error || 'Import failed');
    }
    setTimeout(() => setImportStatus(null), 3000);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Floating Bottom Center Minimal Toolbar */}
      <nav
        aria-label="Pinboard actions"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-300 shadow-md text-neutral-800 select-none transition-all duration-150"
      >
        {/* Draggable Note Element (not a button, dragged directly to canvas) */}
        <div
          id="draggable-note-spawner"
          onPointerDown={onStartDragNewNote}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white cursor-grab active:cursor-grabbing text-xs font-medium border border-neutral-900 select-none transition-all ${
            isDraggingNewNote ? 'opacity-40 ring-2 ring-neutral-400' : ''
          }`}
          title="Click and drag onto canvas to place a new note"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>+ Drag Note</span>
        </div>

        <div className="h-4 w-px bg-neutral-200 mx-0.5" />

        {/* Export JSON Button */}
        <button
          type="button"
          id="btn-export-json"
          onClick={onExport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-neutral-100 active:bg-neutral-200 text-neutral-700 hover:text-neutral-900 text-xs font-medium transition-colors"
          title="Download JSON backup"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>

        {/* Import JSON Button */}
        <button
          type="button"
          id="btn-import-json"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-neutral-100 active:bg-neutral-200 text-neutral-700 hover:text-neutral-900 text-xs font-medium transition-colors"
          title="Restore board from JSON backup"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import</span>
        </button>

        {/* Clear All Notes */}
        {showClearConfirm ? (
          <div className="flex items-center gap-1 bg-neutral-100 border border-neutral-300 px-2 py-1 text-xs">
            <span className="text-red-600 font-medium">Clear all?</span>
            <button
              type="button"
              id="btn-clear-confirm"
              onClick={() => {
                onClear();
                setShowClearConfirm(false);
              }}
              className="px-1.5 py-0.5 bg-red-600 text-white text-[11px] font-medium"
            >
              Yes
            </button>
            <button
              type="button"
              id="btn-clear-cancel"
              onClick={() => setShowClearConfirm(false)}
              className="px-1.5 py-0.5 text-neutral-600 text-[11px]"
            >
              Cancel
            </button>
          </div>
        ) : (
          noteCount > 0 && (
            <button
              type="button"
              id="btn-clear-board"
              onClick={() => setShowClearConfirm(true)}
              className="p-1.5 hover:bg-red-50 hover:text-red-600 text-neutral-400 transition-colors"
              title="Clear all notes"
              aria-label="Clear all notes"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )
        )}

        <div className="h-4 w-px bg-neutral-200 mx-0.5" />

        {/* Note Counter & Save Status */}
        <div className="flex items-center gap-1.5 px-1.5 text-[11px] text-neutral-500">
          <span>{noteCount} {noteCount === 1 ? 'note' : 'notes'}</span>
          <span className="flex items-center text-emerald-700 font-medium gap-0.5">
            <Check className="w-3 h-3" />
            <span>Saved</span>
          </span>
        </div>
      </nav>

      {/* Notification Toast for Import Status */}
      {importStatus && (
        <div
          id="import-toast"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 bg-neutral-900 text-white text-xs border border-neutral-800 shadow-md"
        >
          {importStatus}
        </div>
      )}
    </>
  );
};
