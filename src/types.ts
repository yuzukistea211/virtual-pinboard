export type NoteColorId =
  | 'white'
  | 'yellow'
  | 'canary'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'peach'
  | 'slate'
  | 'dark'
  | 'custom';

export interface NoteColorPreset {
  id: string;
  name: string;
  hex: string;
  isDark?: boolean;
}

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
  color?: string; // Hex color code e.g. '#ffffff' or '#fef08a' or custom hex
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
  sizeScale: number; // percentage (75 to 150)
  letterSpacing: number; // in px (-2 to 8, default 0)
  lineHeight: number; // multiplier (1.1 to 2.4, default 1.5)
}

export interface ThemeColorPreset {
  id: string;
  name: string;
  hex: string;
  description?: string;
  dark?: boolean;
}

export interface ThemeSettings {
  themeColor: string; // HEX color code e.g. #ffffff
}

export interface CustomMarkdownRule {
  id: string;
  name: string;
  prefix: string; // e.g. "!!" or "::" or "@@" or "[tag]"
  suffix: string; // e.g. "!!" or "::" or "@@" or "[/tag]"
  fontWeight: string; // e.g. '400', '500', '600', '700', '800', '900'
  isBold: boolean;
  isItalic: boolean;
  fontSize: string; // e.g. '11px', '12px', '13px', '14px', '16px' or '0.85em', '1em', etc.
  backgroundColor: string; // hex color or 'transparent'
  textColor: string; // hex color or 'inherit'
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  rotate: number; // degrees -15 to +15
  scale?: number; // 0.85 to 1.25
  skewX?: number; // degrees -15 to +15
  borderRadius?: string; // e.g. '0px', '2px', '4px', '9999px'
  borderWidth?: number; // 0, 1, 2
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderColor?: string;
  paddingHorizontal?: number; // in px
  paddingVertical?: number; // in px
  letterSpacing?: number; // in px
  textDecoration?: 'none' | 'underline' | 'line-through';
  createdAt?: number;
}

