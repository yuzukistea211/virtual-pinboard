import React, { useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  onToggleTask?: (taskIndex: number) => void;
  onDoubleClick?: () => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onToggleTask,
  onDoubleClick,
}) => {
  // Counter ref to map rendered checkboxes to their sequential task index in the markdown
  const taskIndexCounter = useRef<number>(0);
  taskIndexCounter.current = 0;

  if (!content || !content.trim()) {
    return (
      <div
        onDoubleClick={onDoubleClick}
        className="w-full h-full flex items-center justify-center text-neutral-400 italic text-xs select-none cursor-pointer"
        title="Double-click to write in Markdown"
      >
        Empty note. Double-click or press &ldquo;Edit&rdquo; to write.
      </div>
    );
  }

  return (
    <div
      onDoubleClick={onDoubleClick}
      className="markdown-body w-full h-full text-neutral-800 text-xs leading-relaxed select-text overflow-y-auto pr-1"
      style={{ wordBreak: 'break-word' }}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-sm font-bold text-neutral-900 mt-1 mb-1 pb-1 border-b border-neutral-200">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xs font-semibold text-neutral-900 mt-1.5 mb-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-semibold text-neutral-800 mt-1 mb-0.5">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-1.5 last:mb-0 leading-relaxed text-neutral-800">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 space-y-0.5 mb-1.5 text-neutral-800">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 space-y-0.5 mb-1.5 text-neutral-800">
              {children}
            </ol>
          ),
          li: ({ children, className }) => {
            const isTask = className?.includes('task-list-item');
            return (
              <li
                className={`leading-relaxed ${
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
                  className="mt-0.5 w-3.5 h-3.5 accent-neutral-900 cursor-pointer rounded-none shrink-0"
                />
              );
            }
            return null;
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-neutral-300 pl-2 italic text-neutral-600 my-1">
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <pre className="bg-neutral-100 p-1.5 my-1 overflow-x-auto text-[11px] font-mono text-neutral-900 border border-neutral-200">
                  <code>{children}</code>
                </pre>
              );
            }
            return (
              <code className="bg-neutral-100 px-1 py-0.5 text-[11px] font-mono text-neutral-900 border border-neutral-200">
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
              className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600 font-medium"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-1.5 border-neutral-200" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-1.5">
              <table className="w-full text-[11px] border-collapse border border-neutral-200">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 font-semibold text-left text-neutral-900">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-neutral-200 px-1.5 py-0.5 text-neutral-800">
              {children}
            </td>
          ),
          del: ({ children }) => (
            <del className="text-neutral-400 line-through">{children}</del>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-neutral-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-neutral-800">{children}</em>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};
