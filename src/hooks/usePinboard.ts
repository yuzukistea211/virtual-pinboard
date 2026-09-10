import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StickyNote, Pinboard, BoardExportData, MultiBoardExportData } from '../types';
import {
  STORAGE_KEY,
  BOARDS_STORAGE_KEY,
  ACTIVE_BOARD_STORAGE_KEY,
  INITIAL_NOTES,
  DEFAULT_NOTE_WIDTH,
  DEFAULT_NOTE_HEIGHT,
  MIN_NOTE_WIDTH,
  MIN_NOTE_HEIGHT,
} from '../constants';

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export function usePinboard() {
  // Initialize boards from local storage with migration fallback
  const [boards, setBoards] = useState<Pinboard[]>(() => {
    try {
      // 1. Check for multi-board storage
      const storedBoards = localStorage.getItem(BOARDS_STORAGE_KEY);
      if (storedBoards) {
        const parsed = JSON.parse(storedBoards);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((b: any, bIdx: number) => ({
            id: typeof b.id === 'string' && b.id ? b.id : `board_${bIdx + 1}`,
            name: typeof b.name === 'string' && b.name.trim() ? b.name.trim() : `Board ${bIdx + 1}`,
            createdAt: typeof b.createdAt === 'number' ? b.createdAt : Date.now(),
            updatedAt: typeof b.updatedAt === 'number' ? b.updatedAt : Date.now(),
            notes: Array.isArray(b.notes)
              ? b.notes.map((n: any) => ({
                  ...n,
                  color: typeof n.color === 'string' && n.color ? n.color : '#ffffff',
                  width: typeof n.width === 'number' && n.width >= MIN_NOTE_WIDTH ? n.width : DEFAULT_NOTE_WIDTH,
                  height: typeof n.height === 'number' && n.height >= MIN_NOTE_HEIGHT ? n.height : DEFAULT_NOTE_HEIGHT,
                }))
              : [],
          }));
        }
      }

      // 2. Fallback: migrate from single-board storage if available
      const legacyStored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('pinboard_notes_storage_v1');
      if (legacyStored) {
        const parsedLegacy = JSON.parse(legacyStored);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          const migratedNotes = parsedLegacy.map((n: any) => ({
            ...n,
            color: typeof n.color === 'string' && n.color ? n.color : '#ffffff',
            width: typeof n.width === 'number' && n.width >= MIN_NOTE_WIDTH ? n.width : DEFAULT_NOTE_WIDTH,
            height: typeof n.height === 'number' && n.height >= MIN_NOTE_HEIGHT ? n.height : DEFAULT_NOTE_HEIGHT,
          }));

          return [
            {
              id: 'board-main',
              name: 'Main Board',
              notes: migratedNotes,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ];
        }
      }
    } catch (e) {
      console.error('Failed to load boards from localStorage', e);
    }

    // 3. Default starter board with INITIAL_NOTES
    return [
      {
        id: 'board-main',
        name: 'Main Board',
        notes: INITIAL_NOTES,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
  });

  // Active board ID
  const [activeBoardId, setActiveBoardId] = useState<string>(() => {
    try {
      const storedActiveId = localStorage.getItem(ACTIVE_BOARD_STORAGE_KEY);
      if (storedActiveId) return storedActiveId;
    } catch {
      // safe fallback
    }
    return 'board-main';
  });

  const [lastSaved, setLastSaved] = useState<number>(Date.now());
  const maxZIndexRef = useRef<number>(10);

  // Ensure activeBoardId points to an existing board
  const activeBoard = useMemo(() => {
    const found = boards.find((b) => b.id === activeBoardId);
    return found || boards[0] || {
      id: 'board-fallback',
      name: 'Default Board',
      notes: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }, [boards, activeBoardId]);

  const activeNotes = activeBoard.notes;

  // Sync activeBoardId if it was removed
  useEffect(() => {
    if (!boards.some((b) => b.id === activeBoardId) && boards.length > 0) {
      setActiveBoardId(boards[0].id);
    }
  }, [boards, activeBoardId]);

  // Sync maxZIndex for active board
  useEffect(() => {
    if (activeNotes.length > 0) {
      const highest = Math.max(...activeNotes.map((n) => n.zIndex || 1), 1);
      maxZIndexRef.current = Math.max(maxZIndexRef.current, highest);
    }
  }, [activeNotes]);

  // Persist boards to localStorage whenever boards change
  useEffect(() => {
    try {
      localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(boards));
      // Also maintain legacy STORAGE_KEY for active board
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeNotes));
      setLastSaved(Date.now());
    } catch (e) {
      console.error('Failed to save boards to localStorage', e);
    }
  }, [boards, activeNotes]);

  // Persist activeBoardId
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_BOARD_STORAGE_KEY, activeBoardId);
    } catch (e) {
      console.error('Failed to save activeBoardId to localStorage', e);
    }
  }, [activeBoardId]);

  // Board management actions
  const selectBoard = useCallback((boardId: string) => {
    if (boards.some((b) => b.id === boardId)) {
      setActiveBoardId(boardId);
    }
  }, [boards]);

  const createBoard = useCallback((initialName?: string) => {
    const newBoardId = generateId('board');
    const boardName = initialName?.trim() || `Board ${boards.length + 1}`;

    const newBoard: Pinboard = {
      id: newBoardId,
      name: boardName,
      notes: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setBoards((prev) => [...prev, newBoard]);
    setActiveBoardId(newBoardId);
    return newBoard;
  }, [boards.length]);

  const renameBoard = useCallback((boardId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setBoards((prev) =>
      prev.map((b) =>
        b.id === boardId ? { ...b, name: trimmed, updatedAt: Date.now() } : b
      )
    );
  }, []);

  const deleteBoard = useCallback((boardId: string) => {
    setBoards((prev) => {
      // If deleting the only board, reset it to an empty board
      if (prev.length <= 1) {
        return [
          {
            id: 'board-main',
            name: 'Main Board',
            notes: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ];
      }
      return prev.filter((b) => b.id !== boardId);
    });

    // If deleting the current active board, switch to another board
    setActiveBoardId((prevActive) => {
      if (prevActive === boardId) {
        const remaining = boards.filter((b) => b.id !== boardId);
        return remaining[0]?.id || 'board-main';
      }
      return prevActive;
    });
  }, [boards]);

  const duplicateBoard = useCallback((boardId: string) => {
    const targetBoard = boards.find((b) => b.id === boardId);
    if (!targetBoard) return;

    const newBoardId = generateId('board');
    const duplicatedNotes: StickyNote[] = targetBoard.notes.map((n, i) => ({
      ...n,
      id: generateId('note') + `_${i}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    const newBoard: Pinboard = {
      id: newBoardId,
      name: `${targetBoard.name} (Copy)`,
      notes: duplicatedNotes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setBoards((prev) => [...prev, newBoard]);
    setActiveBoardId(newBoardId);
  }, [boards]);

  // Note management within active board
  const updateActiveNotes = useCallback(
    (updater: (currentNotes: StickyNote[]) => StickyNote[]) => {
      setBoards((prev) =>
        prev.map((b) => {
          if (b.id === activeBoardId) {
            return {
              ...b,
              notes: updater(b.notes),
              updatedAt: Date.now(),
            };
          }
          return b;
        })
      );
    },
    [activeBoardId]
  );

  const bringToFront = useCallback((id: string) => {
    maxZIndexRef.current += 1;
    const newZ = maxZIndexRef.current;

    // Keep note z-indexes tidy so they never exceed overlay layers
    if (newZ > 500) {
      updateActiveNotes((prev) => {
        const sorted = [...prev].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));
        const normalized = sorted.map((note, idx) => ({
          ...note,
          zIndex: note.id === id ? sorted.length + 1 : idx + 1,
        }));
        maxZIndexRef.current = sorted.length + 1;
        return normalized;
      });
      return;
    }

    updateActiveNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, zIndex: newZ } : note))
    );
  }, [updateActiveNotes]);

  const addNote = useCallback(
    (
      x?: number,
      y?: number,
      width: number = DEFAULT_NOTE_WIDTH,
      height: number = DEFAULT_NOTE_HEIGHT,
      color?: string
    ) => {
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
        id: generateId('note'),
        content: '',
        x: Math.max(0, Math.round(posX)),
        y: Math.max(0, Math.round(posY)),
        width: Math.max(MIN_NOTE_WIDTH, width),
        height: Math.max(MIN_NOTE_HEIGHT, height),
        color: color || '#ffffff',
        zIndex: newZ,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      updateActiveNotes((prev) => [...prev, newNote]);
      return newNote;
    },
    [updateActiveNotes]
  );

  const updateNoteColor = useCallback((id: string, color: string) => {
    updateActiveNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, color, updatedAt: Date.now() } : note
      )
    );
  }, [updateActiveNotes]);

  const updateNoteContent = useCallback((id: string, content: string) => {
    updateActiveNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, content, updatedAt: Date.now() } : note
      )
    );
  }, [updateActiveNotes]);

  const updateNotePosition = useCallback((id: string, x: number, y: number) => {
    updateActiveNotes((prev) =>
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
  }, [updateActiveNotes]);

  const updateNoteSize = useCallback((id: string, width: number, height: number) => {
    updateActiveNotes((prev) =>
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
  }, [updateActiveNotes]);

  const deleteNote = useCallback((id: string) => {
    updateActiveNotes((prev) => prev.filter((note) => note.id !== id));
  }, [updateActiveNotes]);

  const clearBoard = useCallback(() => {
    updateActiveNotes(() => []);
  }, [updateActiveNotes]);

  // Export & Import
  const exportBoardJSON = useCallback((exportAll: boolean = false) => {
    const dateStr = new Date().toISOString().split('T')[0];
    let jsonString = '';
    let filename = '';

    if (exportAll) {
      const payload: MultiBoardExportData = {
        version: 2,
        exportedAt: new Date().toISOString(),
        activeBoardId,
        boards,
      };
      jsonString = JSON.stringify(payload, null, 2);
      filename = `pinboards-all-backup-${dateStr}.json`;
    } else {
      const payload: BoardExportData = {
        version: 2,
        exportedAt: new Date().toISOString(),
        boardName: activeBoard.name,
        noteCount: activeNotes.length,
        notes: activeNotes,
      };
      jsonString = JSON.stringify(payload, null, 2);
      const safeName = activeBoard.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      filename = `pinboard-${safeName}-${dateStr}.json`;
    }

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [boards, activeBoard, activeBoardId, activeNotes]);

  const importBoardJSON = useCallback((file: File): Promise<{ success: boolean; count?: number; error?: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);

          // Case 1: Multi-board backup (parsed.boards is array)
          if (parsed && Array.isArray(parsed.boards) && parsed.boards.length > 0) {
            const importedBoards: Pinboard[] = parsed.boards.map((b: any, bIdx: number) => ({
              id: typeof b.id === 'string' && b.id ? b.id : generateId(`board_${bIdx}`),
              name: typeof b.name === 'string' && b.name.trim() ? b.name.trim() : `Imported Board ${bIdx + 1}`,
              createdAt: typeof b.createdAt === 'number' ? b.createdAt : Date.now(),
              updatedAt: Date.now(),
              notes: Array.isArray(b.notes)
                ? b.notes.map((n: any, nIdx: number) => ({
                    id: typeof n.id === 'string' ? n.id : generateId(`note_${nIdx}`),
                    content: typeof n.content === 'string' ? n.content : '',
                    x: typeof n.x === 'number' && !isNaN(n.x) ? Math.max(0, n.x) : 50,
                    y: typeof n.y === 'number' && !isNaN(n.y) ? Math.max(0, n.y) : 50,
                    width: typeof n.width === 'number' && n.width >= MIN_NOTE_WIDTH ? n.width : DEFAULT_NOTE_WIDTH,
                    height: typeof n.height === 'number' && n.height >= MIN_NOTE_HEIGHT ? n.height : DEFAULT_NOTE_HEIGHT,
                    color: typeof n.color === 'string' && n.color ? n.color : '#ffffff',
                    zIndex: typeof n.zIndex === 'number' ? n.zIndex : nIdx + 1,
                    createdAt: typeof n.createdAt === 'number' ? n.createdAt : Date.now(),
                    updatedAt: Date.now(),
                  }))
                : [],
            }));

            setBoards(importedBoards);
            const targetActive = parsed.activeBoardId && importedBoards.some((b) => b.id === parsed.activeBoardId)
              ? parsed.activeBoardId
              : importedBoards[0].id;
            setActiveBoardId(targetActive);
            resolve({ success: true, count: importedBoards.length });
            return;
          }

          // Case 2: Single board export or notes array
          let importedNotes: any[] = [];
          let importedName = 'Imported Board';

          if (Array.isArray(parsed)) {
            importedNotes = parsed;
          } else if (parsed && Array.isArray(parsed.notes)) {
            importedNotes = parsed.notes;
            if (typeof parsed.boardName === 'string' && parsed.boardName.trim()) {
              importedName = parsed.boardName.trim();
            }
          } else {
            resolve({ success: false, error: 'Invalid JSON format. Expected notes or boards.' });
            return;
          }

          const validNotes: StickyNote[] = importedNotes.map((n, idx) => ({
            id: typeof n.id === 'string' ? n.id : generateId('note') + `_${idx}`,
            content: typeof n.content === 'string' ? n.content : '',
            x: typeof n.x === 'number' && !isNaN(n.x) ? Math.max(0, n.x) : 50 + (idx % 10) * 30,
            y: typeof n.y === 'number' && !isNaN(n.y) ? Math.max(0, n.y) : 50 + (idx % 10) * 30,
            width: typeof n.width === 'number' && n.width >= MIN_NOTE_WIDTH ? n.width : DEFAULT_NOTE_WIDTH,
            height: typeof n.height === 'number' && n.height >= MIN_NOTE_HEIGHT ? n.height : DEFAULT_NOTE_HEIGHT,
            color: typeof n.color === 'string' && n.color ? n.color : '#ffffff',
            zIndex: typeof n.zIndex === 'number' ? n.zIndex : idx + 1,
            createdAt: typeof n.createdAt === 'number' ? n.createdAt : Date.now(),
            updatedAt: Date.now(),
          }));

          // Ask to add as a new board or replace current
          const newBoardId = generateId('board');
          const newBoard: Pinboard = {
            id: newBoardId,
            name: importedName,
            notes: validNotes,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          setBoards((prev) => [...prev, newBoard]);
          setActiveBoardId(newBoardId);
          resolve({ success: true, count: validNotes.length });
        } catch {
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
    boards,
    activeBoard,
    activeBoardId,
    notes: activeNotes,
    lastSaved,
    selectBoard,
    createBoard,
    renameBoard,
    deleteBoard,
    duplicateBoard,
    addNote,
    updateNoteColor,
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

