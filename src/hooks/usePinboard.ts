import { useState, useEffect, useCallback, useRef } from 'react';
import { StickyNote, BoardExportData } from '../types';
import {
  STORAGE_KEY,
  INITIAL_NOTES,
  DEFAULT_NOTE_WIDTH,
  DEFAULT_NOTE_HEIGHT,
  MIN_NOTE_WIDTH,
  MIN_NOTE_HEIGHT,
} from '../constants';

export function usePinboard() {
  const [notes, setNotes] = useState<StickyNote[]>(() => {
    try {
      // Check v2 first, fallback to v1 if present
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('pinboard_notes_storage_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((n: any) => ({
            ...n,
            color: 'white',
            width: typeof n.width === 'number' && n.width >= MIN_NOTE_WIDTH ? n.width : DEFAULT_NOTE_WIDTH,
            height: typeof n.height === 'number' && n.height >= MIN_NOTE_HEIGHT ? n.height : DEFAULT_NOTE_HEIGHT,
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load notes from localStorage', e);
    }
    return INITIAL_NOTES;
  });

  const [lastSaved, setLastSaved] = useState<number>(Date.now());
  const maxZIndexRef = useRef<number>(10);

  // Sync maxZIndex
  useEffect(() => {
    if (notes.length > 0) {
      const highest = Math.max(...notes.map((n) => n.zIndex || 1), 1);
      maxZIndexRef.current = Math.max(maxZIndexRef.current, highest);
    }
  }, [notes]);

  // Persist to localStorage whenever notes change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      setLastSaved(Date.now());
    } catch (e) {
      console.error('Failed to save notes to localStorage', e);
    }
  }, [notes]);

  const bringToFront = useCallback((id: string) => {
    maxZIndexRef.current += 1;
    const newZ = maxZIndexRef.current;
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, zIndex: newZ } : note))
    );
  }, []);

  const addNote = useCallback(
    (x?: number, y?: number, width: number = DEFAULT_NOTE_WIDTH, height: number = DEFAULT_NOTE_HEIGHT) => {
      maxZIndexRef.current += 1;
      const newZ = maxZIndexRef.current;

      let posX = x;
      let posY = y;

      if (posX === undefined || posY === undefined) {
        const screenW = typeof window !== 'undefined' ? window.innerWidth : 800;
        const screenH = typeof window !== 'undefined' ? window.innerHeight : 600;
        const jitterX = Math.floor(Math.random() * 80) - 40;
        const jitterY = Math.floor(Math.random() * 80) - 40;
        posX = Math.max(20, Math.floor(screenW / 2 - width / 2 + jitterX));
        posY = Math.max(20, Math.floor(screenH / 2 - height / 2 + jitterY));
      }

      const newNote: StickyNote = {
        id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        content: '',
        x: Math.max(0, Math.round(posX)),
        y: Math.max(0, Math.round(posY)),
        width: Math.max(MIN_NOTE_WIDTH, width),
        height: Math.max(MIN_NOTE_HEIGHT, height),
        color: 'white',
        zIndex: newZ,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setNotes((prev) => [...prev, newNote]);
      return newNote;
    },
    []
  );

  const updateNoteContent = useCallback((id: string, content: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, content, updatedAt: Date.now() } : note
      )
    );
  }, []);

  const updateNotePosition = useCallback((id: string, x: number, y: number) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              x: Math.max(0, Math.round(x)),
              y: Math.max(0, Math.round(y)),
              updatedAt: Date.now(),
            }
          : note
      )
    );
  }, []);

  const updateNoteSize = useCallback((id: string, width: number, height: number) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              width: Math.max(MIN_NOTE_WIDTH, Math.round(width)),
              height: Math.max(MIN_NOTE_HEIGHT, Math.round(height)),
              updatedAt: Date.now(),
            }
          : note
      )
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }, []);

  const clearBoard = useCallback(() => {
    setNotes([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const exportBoardJSON = useCallback(() => {
    const exportPayload: BoardExportData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      noteCount: notes.length,
      notes,
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `pinboard-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [notes]);

  const importBoardJSON = useCallback((file: File): Promise<{ success: boolean; count?: number; error?: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);

          let importedNotes: any[] = [];
          if (Array.isArray(parsed)) {
            importedNotes = parsed;
          } else if (parsed && Array.isArray(parsed.notes)) {
            importedNotes = parsed.notes;
          } else {
            resolve({ success: false, error: 'Invalid JSON format. Expected notes array.' });
            return;
          }

          const validNotes: StickyNote[] = importedNotes.map((n, idx) => ({
            id: typeof n.id === 'string' ? n.id : `imported_${Date.now()}_${idx}`,
            content: typeof n.content === 'string' ? n.content : '',
            x: typeof n.x === 'number' && !isNaN(n.x) ? Math.max(0, n.x) : 50 + idx * 25,
            y: typeof n.y === 'number' && !isNaN(n.y) ? Math.max(0, n.y) : 50 + idx * 25,
            width: typeof n.width === 'number' && n.width >= MIN_NOTE_WIDTH ? n.width : DEFAULT_NOTE_WIDTH,
            height: typeof n.height === 'number' && n.height >= MIN_NOTE_HEIGHT ? n.height : DEFAULT_NOTE_HEIGHT,
            color: 'white',
            zIndex: typeof n.zIndex === 'number' ? n.zIndex : idx + 1,
            createdAt: typeof n.createdAt === 'number' ? n.createdAt : Date.now(),
            updatedAt: Date.now(),
          }));

          setNotes(validNotes);
          resolve({ success: true, count: validNotes.length });
        } catch (err) {
          resolve({ success: false, error: 'Unable to parse JSON file.' });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read file.' });
      };
      reader.readAsText(file);
    });
  }, []);

  return {
    notes,
    lastSaved,
    addNote,
    updateNoteContent,
    updateNotePosition,
    updateNoteSize,
    bringToFront,
    deleteNote,
    clearBoard,
    exportBoardJSON,
    importBoardJSON,
  };
}
