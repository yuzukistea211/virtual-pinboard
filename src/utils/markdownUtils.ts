import React from 'react';
import { CustomMarkdownRule } from '../types';

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

/**
 * Generates an inline React CSSProperties object based on a custom markdown rule.
 * Covers font weight, bold, italic, font size, background color, transform properties, text color, etc.
 */
export function getCustomMarkdownStyle(rule: CustomMarkdownRule): React.CSSProperties {
  const transforms: string[] = [];

  // Transform properties: 2D rotate, scale, skew
  if (typeof rule.rotate === 'number' && rule.rotate !== 0) {
    transforms.push(`rotate(${rule.rotate}deg)`);
  }
  if (typeof rule.scale === 'number' && rule.scale !== 1) {
    transforms.push(`scale(${rule.scale})`);
  }
  if (typeof rule.skewX === 'number' && rule.skewX !== 0) {
    transforms.push(`skewX(${rule.skewX}deg)`);
  }

  // Weight handling
  let weight = rule.fontWeight || '400';
  if (rule.isBold) {
    const numWeight = parseInt(weight, 10);
    if (isNaN(numWeight) || numWeight < 700) {
      weight = '700';
    }
  }

  // Font size
  let fontSizeVal = rule.fontSize;
  if (!fontSizeVal || fontSizeVal === 'default') {
    fontSizeVal = 'inherit';
  }

  // Text color
  const colorVal =
    !rule.textColor || rule.textColor === 'inherit' || rule.textColor === 'currentColor'
      ? undefined
      : rule.textColor;

  // Background color
  const bgVal =
    !rule.backgroundColor || rule.backgroundColor === 'transparent'
      ? 'transparent'
      : rule.backgroundColor;

  // Border style
  let borderVal: string | undefined = undefined;
  if (rule.borderWidth && rule.borderWidth > 0 && rule.borderStyle && rule.borderStyle !== 'none') {
    borderVal = `${rule.borderWidth}px ${rule.borderStyle} ${rule.borderColor || colorVal || '#d4d4d4'}`;
  }

  return {
    fontWeight: weight as any,
    fontStyle: rule.isItalic ? 'italic' : 'normal',
    fontSize: fontSizeVal,
    color: colorVal,
    backgroundColor: bgVal,
    textTransform: rule.textTransform && rule.textTransform !== 'none' ? rule.textTransform : undefined,
    transform: transforms.length > 0 ? transforms.join(' ') : undefined,
    transformOrigin: 'center center',
    display: 'inline-block',
    borderRadius: rule.borderRadius || '3px',
    border: borderVal,
    padding: `${rule.paddingVertical ?? 1}px ${rule.paddingHorizontal ?? 5}px`,
    margin: '0 2px',
    letterSpacing: typeof rule.letterSpacing === 'number' && rule.letterSpacing !== 0 ? `${rule.letterSpacing}px` : undefined,
    textDecoration: rule.textDecoration && rule.textDecoration !== 'none' ? rule.textDecoration : undefined,
    lineHeight: '1.25',
    verticalAlign: 'baseline',
    boxDecorationBreak: 'clone',
    WebkitBoxDecorationBreak: 'clone',
  };
}

/**
 * Apply a custom markdown rule (wrap selected text or insert placeholder with prefix & suffix)
 */
export function applyCustomMarkdownFormat(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  rule: CustomMarkdownRule
): { newText: string; newCursorStart: number; newCursorEnd: number } {
  const selectedText = content.substring(selectionStart, selectionEnd);
  const before = content.substring(0, selectionStart);
  const after = content.substring(selectionEnd);

  const prefix = rule.prefix || '::';
  const suffix = rule.suffix || '::';
  const inner = selectedText || rule.name || 'custom text';

  const wrapped = `${prefix}${inner}${suffix}`;
  const newText = before + wrapped + after;

  const start = selectionStart + prefix.length;
  const end = selectionStart + prefix.length + inner.length;

  return { newText, newCursorStart: start, newCursorEnd: end };
}
