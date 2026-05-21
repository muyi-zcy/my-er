import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  TEXT_ANNOTATION_MAX_WIDTH,
  TEXT_ANNOTATION_MIN_WIDTH,
  TEXT_ANNOTATION_PADDING,
  TEXT_ANNOTATION_MIN_HEIGHT,
} from '../../graph/constants';

/**
 * @param {import('@antv/x6').Node} node
 */
function readSnapshot(node) {
  const data = node.getData() || {};
  return {
    text: String(data.text || ''),
    editing: Boolean(data.editing),
    isDraft: Boolean(data.isDraft),
  };
}

/**
 * @param {import('@antv/x6').Node} node
 * @param {React.MouseEvent} nativeEvent
 */
function fireAnnotationContextMenu(node, nativeEvent) {
  const canvas = document.querySelector('.er-canvas');
  if (!canvas) return;
  canvas.dispatchEvent(
    new CustomEvent('er-annotation-contextmenu', {
      bubbles: false,
      detail: {
        annotationId: node.id,
        clientX: nativeEvent.clientX,
        clientY: nativeEvent.clientY,
      },
    }),
  );
}

/**
 * @param {import('@antv/x6').Node} node
 * @param {string} text
 */
function fireAnnotationCommit(node, text) {
  const canvas = document.querySelector('.er-canvas');
  if (!canvas) return;
  canvas.dispatchEvent(
    new CustomEvent('er-annotation-commit', {
      bubbles: false,
      detail: { annotationId: node.id, text },
    }),
  );
}

/**
 * @param {import('@antv/x6').Node} node
 */
function fireAnnotationCancel(node) {
  const canvas = document.querySelector('.er-canvas');
  if (!canvas) return;
  canvas.dispatchEvent(
    new CustomEvent('er-annotation-cancel', {
      bubbles: false,
      detail: { annotationId: node.id },
    }),
  );
}

/**
 * @param {import('@antv/x6').Node} node
 * @param {boolean} editing
 */
function setNodeEditing(node, editing) {
  node.setData({ ...node.getData(), editing });
  node.prop('movable', !editing);
}

/**
 * @param {{ node: import('@antv/x6').Node }} props
 */
export default function TextAnnotationNode({ node }) {
  const contentRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const textareaRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null));
  const [snapshot, setSnapshot] = useState(() => readSnapshot(node));
  const [draft, setDraft] = useState(snapshot.text);

  useEffect(() => {
    const sync = () => setSnapshot(readSnapshot(node));
    node.on('change:data', sync);
    return () => node.off('change:data', sync);
  }, [node]);

  useEffect(() => {
    if (snapshot.editing) {
      setDraft(snapshot.text);
    }
  }, [snapshot.editing, snapshot.text]);

  useEffect(() => {
    if (!snapshot.editing) return undefined;
    const el = textareaRef.current;
    if (!el) return undefined;
    el.focus();
    el.select();
    return undefined;
  }, [snapshot.editing]);

  const syncTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useLayoutEffect(() => {
    const el = snapshot.editing ? textareaRef.current : contentRef.current;
    if (!el) return;
    if (snapshot.editing) syncTextareaHeight();
    const width = Math.min(
      TEXT_ANNOTATION_MAX_WIDTH,
      Math.max(TEXT_ANNOTATION_MIN_WIDTH, el.scrollWidth + TEXT_ANNOTATION_PADDING),
    );
    const height = Math.max(TEXT_ANNOTATION_MIN_HEIGHT, el.scrollHeight + TEXT_ANNOTATION_PADDING);
    const size = node.size();
    if (Math.abs(size.width - width) > 1 || Math.abs(size.height - height) > 1) {
      node.resize(width, height);
    }
  }, [node, snapshot.text, snapshot.editing, draft, syncTextareaHeight]);

  const startEditing = useCallback(() => {
    setNodeEditing(node, true);
    setSnapshot(readSnapshot(node));
  }, [node]);

  const finishEditing = useCallback(() => {
    fireAnnotationCommit(node, draft);
  }, [node, draft]);

  const cancelEditing = useCallback(() => {
    fireAnnotationCancel(node);
  }, [node]);

  if (snapshot.editing) {
    return (
      <div
        className="er-text-annotation er-text-annotation--editing"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <textarea
          ref={textareaRef}
          className="er-text-annotation-input"
          value={draft}
          placeholder="输入说明文字，支持换行"
          onChange={(e) => {
            setDraft(e.target.value);
            syncTextareaHeight();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onBlur={finishEditing}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              cancelEditing();
              return;
            }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              finishEditing();
            }
          }}
        />
      </div>
    );
  }

  const displayText = snapshot.text;

  return (
    <div
      className="er-text-annotation"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        fireAnnotationContextMenu(node, e);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        startEditing();
      }}
    >
      <div
        ref={contentRef}
        className={`er-text-annotation-content${displayText ? '' : ' er-text-annotation-content--placeholder'}`}
      >
        {displayText || '双击编辑'}
      </div>
    </div>
  );
}
