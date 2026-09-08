import { StickyNote, Pinboard } from './types';

export const STORAGE_KEY = 'pinboard_notes_storage_v2';
export const BOARDS_STORAGE_KEY = 'pinboards_storage_v1';
export const ACTIVE_BOARD_STORAGE_KEY = 'pinboard_active_board_id_v1';

export const DEFAULT_NOTE_WIDTH = 240;
export const DEFAULT_NOTE_HEIGHT = 200;
export const MIN_NOTE_WIDTH = 160;
export const MIN_NOTE_HEIGHT = 120;

export const INITIAL_NOTES: StickyNote[] = [
  {
    id: 'intro-1',
    content: '### Pinboard with Markdown\n\nOrganize your thoughts on a clean canvas:\n\n- Format with **bold** or *italic*\n- Organize with `# headers` and `- lists`\n- Click **Edit** or double-click to write',
    x: 100,
    y: 90,
    width: 260,
    height: 220,
    color: 'white',
    zIndex: 1,
    createdAt: Date.now() - 3000,
    updatedAt: Date.now() - 3000,
  },
  {
    id: 'intro-2',
    content: '### Interactive Checklists\n\n- [x] Click checkboxes to toggle tasks\n- [ ] Add your daily priorities\n- [ ] Drag corner to resize\n\n*Task states persist automatically.*',
    x: 390,
    y: 100,
    width: 265,
    height: 220,
    color: 'white',
    zIndex: 2,
    createdAt: Date.now() - 2000,
    updatedAt: Date.now() - 2000,
  },
  {
    id: 'intro-3',
    content: '### Quotes & Code Blocks\n\n> "Simplicity is prerequisite for reliability."\n\nInline `code` and blocks:\n```js\nconsole.log("Markdown ready!");\n```',
    x: 685,
    y: 90,
    width: 260,
    height: 220,
    color: 'white',
    zIndex: 3,
    createdAt: Date.now() - 1000,
    updatedAt: Date.now() - 1000,
  },
];
