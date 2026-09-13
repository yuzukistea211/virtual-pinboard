import React, { useRef, useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { isColorDark } from '../utils/themePresets';
import { CustomMarkdownRule } from '../types';
import { getCustomMarkdownStyle } from '../utils/markdownUtils';

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a remark plugin to parse user-defined customized markdown syntax
 * into styled <span> elements according to each rule's syntax (prefix and suffix).
 */
function createRemarkCustomMarkdown(rules: CustomMarkdownRule[]) {
  const activeRules = rules.filter(
    (r) => r.prefix && r.suffix && r.prefix.trim() !== '' && r.suffix.trim() !== ''
  );

  // Sort by total delimiter length descending so longer syntax prefixes match first
  const sortedRules = [...activeRules].sort(
    (a, b) => b.prefix.length + b.suffix.length - (a.prefix.length + a.suffix.length)
  );

  return () => {
    return (tree: any) => {
      if (sortedRules.length === 0) return;

      function visit(node: any) {
        if (!node || !node.children) return;
        const newChildren: any[] = [];

        for (const child of node.children) {
          if (child.type === 'text' && typeof child.value === 'string') {
            let currentPieces: any[] = [{ type: 'text', value: child.value }];

            for (const rule of sortedRules) {
              const rulePattern = new RegExp(
                `(${escapeRegex(rule.prefix)}[^\\n]+?${escapeRegex(rule.suffix)})`,
                'g'
              );

              const nextPieces: any[] = [];
              for (const piece of currentPieces) {
                if (
                  piece.type === 'text' &&
                  typeof piece.value === 'string' &&
                  piece.value.includes(rule.prefix)
                ) {
                  const parts = piece.value.split(rulePattern);
                  for (const part of parts) {
                    if (
                      part.startsWith(rule.prefix) &&
                      part.endsWith(rule.suffix) &&
                      part.length >= rule.prefix.length + rule.suffix.length
                    ) {
                      const innerText = part.slice(
                        rule.prefix.length,
                        part.length - rule.suffix.length
                      );
                      nextPieces.push({
                        type: 'customMarkdown',
                        data: {
                          hName: 'span',
                          hProperties: {
                            'data-custom-markdown-id': rule.id,
                          },
                        },
                        children: [{ type: 'text', value: innerText }],
                      });
                    } else if (part.length > 0) {
                      nextPieces.push({ type: 'text', value: part });
                    }
                  }
                } else {
                  nextPieces.push(piece);
                }
              }
              currentPieces = nextPieces;
            }

            for (const piece of currentPieces) {
              newChildren.push(piece);
            }
          } else {
            visit(child);
            newChildren.push(child);
          }
        }
        node.children = newChildren;
      }

      visit(tree);
    };
  };
}

/**
 * Custom remark plugin to parse ==highlighted words== syntax
 * into standard <mark> elements.
 */
function remarkHighlight() {
  return (tree: any) => {
    function visit(node: any) {
      if (!node || !node.children) return;
      const newChildren: any[] = [];
      for (const child of node.children) {
        if (child.type === 'text' && typeof child.value === 'string' && child.value.includes('==')) {
          const parts = child.value.split(/(==[^=\n]+==)/g);
          for (const part of parts) {
            if (part.startsWith('==') && part.endsWith('==') && part.length > 4) {
              const innerText = part.slice(2, -2);
              newChildren.push({
                type: 'mark',
                data: {
                  hName: 'mark',
                },
                children: [{ type: 'text', value: innerText }],
              });
            } else if (part.length > 0) {
              newChildren.push({ type: 'text', value: part });
            }
          }
        } else {
          visit(child);
          newChildren.push(child);
        }
      }
      node.children = newChildren;
    }
    visit(tree);
  };
}

interface MarkdownRendererProps {
  content: string;
  onToggleTask?: (taskIndex: number) => void;
  onDoubleClick?: () => void;
  isDark?: boolean;
  highlightColor?: string;
  customMarkdownRules?: CustomMarkdownRule[];
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onToggleTask,
  onDoubleClick,
  isDark = false,
  highlightColor,
  customMarkdownRules = [],
}) => {
  // Counter ref to map rendered checkboxes to their sequential task index in the markdown
  const taskIndexCounter = useRef<number>(0);
  taskIndexCounter.current = 0;

  const customMarkdownPlugin = useMemo(() => {
    return createRemarkCustomMarkdown(customMarkdownRules);
  }, [customMarkdownRules]);

  if (!content || !content.trim()) {
    return (
      <div
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick?.();
        }}
        className="markdown-body w-full h-full flex items-center justify-center italic text-xs select-none cursor-pointer text-neutral-400"
        title="Double-click to write in Markdown"
      >
        Empty note. Double-click or press &ldquo;Edit&rdquo; to write.
      </div>
    );
  }

  const textColorClass = isDark ? 'text-neutral-100' : 'text-neutral-800';
  const headingColorClass = isDark ? 'text-white' : 'text-neutral-900';
  const borderColorClass = isDark ? 'border-white/20' : 'border-neutral-200';
  const codeBgClass = isDark ? 'bg-white/10 text-white border-white/20' : 'bg-black/5 text-neutral-900 border-black/10';

  // Support both ==highlighted== and <mark>highlighted</mark>
  const processedContent = content.replace(/<mark>(.*?)<\/mark>/gi, '==$1==');

  return (
    <div
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'A') return;
        e.stopPropagation();
        onDoubleClick?.();
      }}
      className={`markdown-body w-full h-full text-xs select-text overflow-y-auto pr-1 ${textColorClass}`}
      style={{
        wordBreak: 'break-word',
        fontSize: 'calc(0.75rem * var(--app-font-scale, 1))',
        lineHeight: 'var(--app-line-height, 1.5)',
        letterSpacing: 'var(--app-letter-spacing, 0px)',
      }}
    >
      <Markdown
        remarkPlugins={[remarkGfm, remarkHighlight, customMarkdownPlugin]}
        components={{
          span: ({ node, children, ...props }: any) => {
            const ruleId = props['data-custom-markdown-id'];
            if (ruleId && customMarkdownRules) {
              const rule = customMarkdownRules.find((r) => r.id === ruleId);
              if (rule) {
                return (
                  <span
                    className="custom-md-rendered"
                    style={getCustomMarkdownStyle(rule)}
                  >
                    {children}
                  </span>
                );
              }
            }
            return <span {...props}>{children}</span>;
          },
          mark: ({ children }) => {
            const markBg = highlightColor || 'var(--note-highlight-color, #fef08a)';
            const hasDarkBg = highlightColor ? isColorDark(highlightColor) : false;
            const markText = hasDarkBg ? '#ffffff' : 'var(--note-highlight-text, #1e293b)';

            return (
              <mark
                className="px-1.5 py-0.5 font-medium mx-0.5 inline-block relative"
                style={{
                  backgroundColor: markBg,
                  color: markText,
                  transform: 'rotate(-1.2deg)',
                  boxDecorationBreak: 'clone',
                  WebkitBoxDecorationBreak: 'clone',
                }}
              >
                {children}
              </mark>
            );
          },
          h1: ({ children }) => (
            <h1 className={`text-sm font-bold mt-1 mb-1 pb-1 border-b ${headingColorClass} ${borderColorClass}`}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={`text-xs font-semibold mt-1.5 mb-1 ${headingColorClass}`}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={`text-xs font-semibold mt-1 mb-0.5 ${headingColorClass}`}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className={`mb-1.5 last:mb-0 ${textColorClass}`}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className={`list-disc pl-4 space-y-0.5 mb-1.5 ${textColorClass}`}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className={`list-decimal pl-4 space-y-0.5 mb-1.5 ${textColorClass}`}>
              {children}
            </ol>
          ),
          li: ({ children, className }) => {
            const isTask = className?.includes('task-list-item');
            return (
              <li
                className={`${
                  isTask ? 'list-none -ml-4 flex items-start gap-1.5 my-0.5' : ''
                }`}
              >
                {children}
              </li>
            );
          },
          input: ({ type, checked }) => {
            if (type === 'checkbox') {
              const currentTaskIdx = taskIndexCounter.current++;
              return (
                <input
                  type="checkbox"
                  checked={Boolean(checked)}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (onToggleTask) {
                      onToggleTask(currentTaskIdx);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`mt-0.5 w-3.5 h-3.5 cursor-pointer rounded-none shrink-0 ${
                    isDark ? 'accent-white' : 'accent-neutral-900'
                  }`}
                />
              );
            }
            return null;
          },
          blockquote: ({ children }) => (
            <blockquote className={`border-l-2 pl-2 italic my-1 ${
              isDark ? 'border-white/30 text-neutral-300' : 'border-neutral-300 text-neutral-600'
            }`}>
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <pre className={`p-1.5 my-1 overflow-x-auto text-[11px] font-mono border ${codeBgClass}`}>
                  <code>{children}</code>
                </pre>
              );
            }
            return (
              <code className={`px-1 py-0.5 text-[11px] font-mono border ${codeBgClass}`}>
                {children}
              </code>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className={`underline underline-offset-2 font-medium ${
                isDark ? 'text-blue-300 hover:text-blue-200' : 'text-neutral-900 hover:text-neutral-600'
              }`}
            >
              {children}
            </a>
          ),
          hr: () => <hr className={`my-1.5 ${borderColorClass}`} />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-1.5">
              <table className={`w-full text-[11px] border-collapse border ${borderColorClass}`}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className={`border px-1.5 py-0.5 font-semibold text-left ${borderColorClass} ${
              isDark ? 'bg-white/10 text-white' : 'bg-neutral-100 text-neutral-900'
            }`}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className={`border px-1.5 py-0.5 ${borderColorClass} ${textColorClass}`}>
              {children}
            </td>
          ),
          del: ({ children }) => (
            <del className={`line-through ${isDark ? 'text-neutral-400' : 'text-neutral-400'}`}>{children}</del>
          ),
          strong: ({ children }) => (
            <strong className={`font-semibold ${headingColorClass}`}>{children}</strong>
          ),
          em: ({ children }) => (
            <em className={`italic ${textColorClass}`}>{children}</em>
          ),
        }}
      >
        {processedContent}
      </Markdown>
    </div>
  );
};
