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

export interface BoardExportData {
  version: number;
  exportedAt: string;
  noteCount: number;
  notes: StickyNote[];
}
