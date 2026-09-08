export type NoteColorId = 'yellow' | 'green' | 'pink' | 'blue' | 'purple' | 'white';

export interface NoteColorConfig {
  id: NoteColorId;
  name: string;
  bg: string;
  border: string;
  header: string;
  text: string;
  dotColor: string;
}

export interface StickyNote {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  zIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface Pinboard {
  id: string;
  name: string;
  notes: StickyNote[];
  createdAt: number;
  updatedAt: number;
}

export interface BoardExportData {
  version: number;
  exportedAt: string;
  boardName?: string;
  noteCount: number;
  notes: StickyNote[];
}

export interface MultiBoardExportData {
  version: number;
  exportedAt: string;
  activeBoardId: string;
  boards: Pinboard[];
}

export type FontApplyScope = 'all' | 'notes-only';

export interface FontOption {
  id: string;
  name: string;
  category: 'sans' | 'serif' | 'mono' | 'handwriting' | 'display' | 'custom';
  fontFamily: string;
  isCustom?: boolean;
  sourceType?: 'preset' | 'file' | 'web';
  webUrl?: string;
  fileName?: string;
  createdAt?: number;
}

export interface CustomFontRecord {
  id: string;
  name: string;
  fontFamily: string;
  sourceType: 'file' | 'web';
  fileData?: string; // base64 data url for uploaded fonts
  fileName?: string;
  webUrl?: string;
  format?: string;
  createdAt: number;
}

export interface FontSettings {
  selectedFontId: string;
  applyTo: FontApplyScope;
  sizeScale: number; // percentage (90, 100, 110, 120)
}

