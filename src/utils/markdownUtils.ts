/**
 * Utility functions for Markdown manipulation in sticky notes
 */

export function toggleTaskInMarkdown(content: string, targetIndex: number): string {
  let currentIndex = 0;
  return content.replace(/^([ \t]*[-*+][ \t]+\[)([ xX])(\][ \t]+)/gm, (match, prefix, check, suffix) => {
    if (currentIndex === targetIndex) {
      currentIndex++;
      const isChecked = check.trim().toLowerCase() === 'x';
      const newCheck = isChecked ? ' ' : 'x';
      return `${prefix}${newCheck}${suffix}`;
    }
    currentIndex++;
    return match;
  });
}

export type MarkdownFormatType = 'bold' | 'italic' | 'heading' | 'task' | 'list' | 'code' | 'highlight';

export function applyMarkdownFormat(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  formatType: MarkdownFormatType
): { newText: string; newCursorStart: number; newCursorEnd: number } {
  const selectedText = content.substring(selectionStart, selectionEnd);
  const before = content.substring(0, selectionStart);
  const after = content.substring(selectionEnd);

  switch (formatType) {
    case 'highlight': {
      const wrapped = `==${selectedText || 'highlighted text'}==`;
      const newText = before + wrapped + after;
      const start = selectionStart + 2;
      const end = selectionStart + wrapped.length - 2;
      return { newText, newCursorStart: start, newCursorEnd: end };
    }
    case 'bold': {
      const wrapped = `**${selectedText || 'bold text'}**`;
      const newText = before + wrapped + after;
      const start = selectionStart + 2;
      const end = selectionStart + wrapped.length - 2;
      return { newText, newCursorStart: start, newCursorEnd: end };
    }
    case 'italic': {
      const wrapped = `*${selectedText || 'italic text'}*`;
      const newText = before + wrapped + after;
      const start = selectionStart + 1;
      const end = selectionStart + wrapped.length - 1;
      return { newText, newCursorStart: start, newCursorEnd: end };
    }
    case 'heading': {
      // Prepend heading to the current line
      const lastNewline = before.lastIndexOf('\n');
      const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
      const lineBefore = content.substring(0, lineStart);
      const lineRest = content.substring(lineStart);
      
      const newText = lineBefore + '### ' + lineRest;
      return {
        newText,
        newCursorStart: selectionStart + 4,
        newCursorEnd: selectionEnd + 4,
      };
    }
    case 'task': {
      // Prepend task box to current line or wrap selection
      const lastNewline = before.lastIndexOf('\n');
      const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
      const lineBefore = content.substring(0, lineStart);
      const lineRest = content.substring(lineStart);

      const prefix = '- [ ] ';
      const newText = lineBefore + prefix + lineRest;
      return {
        newText,
        newCursorStart: selectionStart + prefix.length,
        newCursorEnd: selectionEnd + prefix.length,
      };
    }
    case 'list': {
      const lastNewline = before.lastIndexOf('\n');
      const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
      const lineBefore = content.substring(0, lineStart);
      const lineRest = content.substring(lineStart);

      const prefix = '- ';
      const newText = lineBefore + prefix + lineRest;
      return {
        newText,
        newCursorStart: selectionStart + prefix.length,
        newCursorEnd: selectionEnd + prefix.length,
      };
    }
    case 'code': {
      if (selectedText.includes('\n')) {
        const wrapped = `\`\`\`\n${selectedText || 'code block'}\n\`\`\``;
        const newText = before + wrapped + after;
        return {
          newText,
          newCursorStart: selectionStart + 4,
          newCursorEnd: selectionStart + wrapped.length - 4,
        };
      }
      const wrapped = `\`${selectedText || 'code'}\``;
      const newText = before + wrapped + after;
      return {
        newText,
        newCursorStart: selectionStart + 1,
        newCursorEnd: selectionStart + wrapped.length - 1,
      };
    }
    default:
      return { newText: content, newCursorStart: selectionStart, newCursorEnd: selectionEnd };
  }
}
