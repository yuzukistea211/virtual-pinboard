import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  ChevronDown,
  Plus,
  Check,
  Pencil,
  Trash2,
  Copy,
  Download,
  X,
} from 'lucide-react';
import { Pinboard } from '../types';

interface BoardSwitcherProps {
  boards: Pinboard[];
  activeBoard: Pinboard;
  activeBoardId: string;
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (name?: string) => void;
  onRenameBoard: (boardId: string, newName: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onDuplicateBoard: (boardId: string) => void;
  onExportAll: () => void;
}

export const BoardSwitcher: React.FC<BoardSwitcherProps> = ({
  boards,
  activeBoard,
  activeBoardId,
  onSelectBoard,
  onCreateBoard,
  onRenameBoard,
  onDeleteBoard,
  onDuplicateBoard,
  onExportAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editBoardName, setEditBoardName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setEditingBoardId(null);
        setConfirmDeleteId(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus input when creating
  useEffect(() => {
    if (isCreating && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [isCreating]);

  // Focus input when editing
  useEffect(() => {
    if (editingBoardId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingBoardId]);

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewBoardName('');
    setEditingBoardId(null);
    setConfirmDeleteId(null);
  };

  const handleFinishCreate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newBoardName.trim();
    if (trimmed) {
      onCreateBoard(trimmed);
    } else {
      onCreateBoard(`Board ${boards.length + 1}`);
    }
    setNewBoardName('');
    setIsCreating(false);
    setIsOpen(false);
  };

  const handleStartRename = (board: Pinboard, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBoardId(board.id);
    setEditBoardName(board.name);
    setConfirmDeleteId(null);
  };

  const handleFinishRename = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingBoardId && editBoardName.trim()) {
      onRenameBoard(editingBoardId, editBoardName.trim());
    }
    setEditingBoardId(null);
    setEditBoardName('');
  };

  const handleDelete = (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteBoard(boardId);
    setConfirmDeleteId(null);
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left select-none">
      {/* Trigger Button */}
      <button
        type="button"
        id="board-switcher-button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 theme-ui-bg hover:opacity-95 active:opacity-90 border border-neutral-300 shadow-xs text-neutral-900 transition-colors group cursor-pointer"
        title="Switch or manage pinboards"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Layers className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-900 transition-colors" />
        <span className="text-xs font-semibold text-neutral-900 max-w-[150px] truncate">
          {activeBoard.name}
        </span>
        <span className="text-[10px] text-neutral-400 font-mono bg-black/5 px-1 py-0.2 border border-neutral-200">
          {activeBoard.notes.length}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-neutral-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-neutral-800' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="board-switcher-dropdown"
          className="absolute left-0 mt-1 w-72 theme-ui-bg border border-neutral-300 shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-100"
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 bg-neutral-50">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Pinboards ({boards.length})
            </span>
            <button
              type="button"
              id="btn-new-board-header"
              onClick={handleStartCreate}
              className="flex items-center gap-1 text-[11px] font-medium text-neutral-700 hover:text-neutral-950 px-1.5 py-0.5 hover:bg-white border border-transparent hover:border-neutral-300 transition-colors cursor-pointer"
              title="Create a new board"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          </div>

          {/* New Board Inline Form */}
          {isCreating && (
            <form
              onSubmit={handleFinishCreate}
              className="p-2 border-b border-neutral-200 bg-neutral-50/70 flex items-center gap-1.5"
            >
              <input
                ref={createInputRef}
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Board name..."
                maxLength={40}
                className="flex-1 px-2 py-1 text-xs border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsCreating(false);
                }}
              />
              <button
                type="submit"
                className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium cursor-pointer"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Boards List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100">
            {boards.map((board) => {
              const isActive = board.id === activeBoardId;
              const isEditing = editingBoardId === board.id;
              const isConfirmingDelete = confirmDeleteId === board.id;

              if (isEditing) {
                return (
                  <form
                    key={board.id}
                    onSubmit={handleFinishRename}
                    className="p-2 bg-neutral-50 flex items-center gap-1.5"
                  >
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editBoardName}
                      onChange={(e) => setEditBoardName(e.target.value)}
                      maxLength={40}
                      className="flex-1 px-2 py-1 text-xs border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditingBoardId(null);
                      }}
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 bg-neutral-900 text-white text-xs font-medium cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingBoardId(null)}
                      className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                );
              }

              return (
                <div
                  key={board.id}
                  onClick={() => {
                    onSelectBoard(board.id);
                    setIsOpen(false);
                  }}
                  className={`group flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-950 font-medium'
                      : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    {isActive ? (
                      <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate max-w-[140px] text-xs" title={board.name}>
                      {board.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      ({board.notes.length})
                    </span>
                  </div>

                  {/* Actions for each board */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(board.id, e)}
                          className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-medium cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                          className="px-1 py-0.5 text-neutral-500 text-[10px] hover:text-neutral-900 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(board, e)}
                          className="p-1 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-800 transition-colors cursor-pointer"
                          title="Rename board"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateBoard(board.id);
                          }}
                          className="p-1 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-800 transition-colors cursor-pointer"
                          title="Duplicate board"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {boards.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(board.id);
                            }}
                            className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete board"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Menu Footer */}
          <div className="p-2 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs">
            {/* <button
              type="button"
              id="btn-create-board-footer"
              onClick={handleStartCreate}
              className="flex items-center gap-1 text-[11px] text-neutral-700 hover:text-neutral-950 font-medium py-1 px-1.5 hover:bg-white border border-transparent hover:border-neutral-300 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Pinboard</span>
            </button>*/}
            <button
              type="button"
              id="btn-export-all-boards"
              onClick={() => {
                onExportAll();
                setIsOpen(false);
              }}
              className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 py-1 px-1.5 transition-colors cursor-pointer"
              title="Export complete backup of all pinboards"
            >
              <Download className="w-3 h-3" />
              <span>Backup All</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
