import { useEffect, useRef } from 'react';

/**
 * @param {{
 *   x: number,
 *   y: number,
 *   draft: string,
 *   onDraftChange: (value: string) => void,
 *   onCommit: () => void,
 *   onCancel: () => void,
 * }} props
 */
export default function EdgeCommentEditor({ x, y, draft, onDraftChange, onCommit, onCancel }) {
  const textareaRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null));

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return undefined;
    el.focus();
    el.select();
    return undefined;
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  return (
    <div
      className="er-edge-comment-editor"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        ref={textareaRef}
        className="er-edge-comment-input"
        rows={2}
        value={draft}
        placeholder="输入连线说明"
        onChange={(e) => onDraftChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
            return;
          }
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onCommit();
          }
        }}
      />
    </div>
  );
}
