import React, { useCallback, useEffect, useRef, useState } from 'react';
import { columnKeyType } from '../../model/erDiagram';
import { tableHeight } from '../../graph/constants';

const BADGES = {
  primary: 'PK',
  foreign: 'FK',
  unique: 'UQ',
};

/** @param {import('@antv/x6').Node} node */
function readSnapshot(node) {
  const data = node.getData() || {};
  return {
    name: data.name || '',
    comment: data.comment || '',
    columns: Array.isArray(data.columns) ? data.columns : [],
    revision: data.revision ?? 0,
  };
}

/**
 * @param {import('@antv/x6').Node} node
 * @param {'header' | 'field'} target
 * @param {React.MouseEvent} nativeEvent
 */
function fireNodeContextMenu(node, target, nativeEvent) {
  const canvas = document.querySelector('.er-canvas');
  if (!canvas) return;
  const el = nativeEvent.currentTarget;
  const columnId =
    target === 'field' && el instanceof HTMLElement ? el.dataset.columnId : undefined;
  canvas.dispatchEvent(
    new CustomEvent('er-node-contextmenu', {
      bubbles: false,
      detail: {
        tableId: node.id,
        target,
        columnId,
        clientX: nativeEvent.clientX,
        clientY: nativeEvent.clientY,
      },
    }),
  );
}

/**
 * @param {import('@antv/x6').Node} node
 * @param {string} columnId
 * @param {number} toIndex
 */
function fireReorderColumn(node, columnId, toIndex) {
  const canvas = document.querySelector('.er-canvas');
  if (!canvas) return;
  canvas.dispatchEvent(
    new CustomEvent('er-reorder-column', {
      bubbles: false,
      detail: { tableId: node.id, columnId, toIndex },
    }),
  );
}

/**
 * @param {{
 *   col: import('../../model/erDiagram').Column,
 *   index: number,
 *   onFieldContextMenu: (e: React.MouseEvent) => void,
 *   dragColumnId: string | null,
 *   dropIndex: number | null,
 *   onDragStart: (columnId: string) => void,
 *   onDragEnd: () => void,
 *   onDragOver: (index: number) => void,
 *   onDrop: (index: number) => void,
 * }} props
 */
function FieldRow({
  col,
  index,
  onFieldContextMenu,
  dragColumnId,
  dropIndex,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) {
  const keyType = columnKeyType(col);
  const isDragging = dragColumnId === col.id;
  const isDropTarget = dropIndex === index && dragColumnId && dragColumnId !== col.id;

  return (
    <div
      data-column-id={col.id}
      className={`er-table-field ${index % 2 === 0 ? 'even' : 'odd'} ${keyType || ''}${isDragging ? ' dragging' : ''}${isDropTarget ? ' drop-target' : ''}`}
      onContextMenu={onFieldContextMenu}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDragOver(index);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop(index);
      }}
    >
      <span
        className="er-field-drag"
        draggable
        title="拖拽排序"
        onMouseDown={(e) => e.stopPropagation()}
        onDragStart={(e) => {
          e.stopPropagation();
          onDragStart(col.id);
          if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', col.id);
          }
        }}
        onDragEnd={(e) => {
          e.stopPropagation();
          onDragEnd();
        }}
      >
        ⋮⋮
      </span>
      <span className="er-field-badge">{keyType ? BADGES[keyType] : ''}</span>
      <span className="er-field-name">{col.name}</span>
      <span className="er-field-type">{col.dataType}</span>
    </div>
  );
}

/**
 * @param {{ node: import('@antv/x6').Node }} props
 */
export default function ERTableNode({ node }) {
  const [snap, setSnap] = useState(() => readSnapshot(node));
  const [dragColumnId, setDragColumnId] = useState(/** @type {string | null} */ (null));
  const [dropIndex, setDropIndex] = useState(/** @type {number | null} */ (null));
  const dragColumnIdRef = useRef(/** @type {string | null} */ (null));

  useEffect(() => {
    const onChange = ({ key }) => {
      const k = String(key);
      if (k === 'data' || k === 'ports' || k === 'size') {
        setSnap(readSnapshot(node));
      }
    };
    node.on('change:*', onChange);
    return () => {
      node.off('change:*', onChange);
    };
  }, [node]);

  const { name, comment, columns } = snap;
  const height = tableHeight(columns.length);

  const onHeaderContextMenu = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      fireNodeContextMenu(node, 'header', e);
    },
    [node],
  );

  const onFieldContextMenu = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      fireNodeContextMenu(node, 'field', e);
    },
    [node],
  );

  const handleDragStart = useCallback((columnId) => {
    dragColumnIdRef.current = columnId;
    setDragColumnId(columnId);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragColumnIdRef.current = null;
    setDragColumnId(null);
    setDropIndex(null);
  }, []);

  const handleDragOver = useCallback((index) => {
    setDropIndex(index);
  }, []);

  const handleDrop = useCallback(
    (toIndex) => {
      const columnId = dragColumnIdRef.current;
      handleDragEnd();
      if (!columnId) return;
      const fromIndex = columns.findIndex((c) => c.id === columnId);
      if (fromIndex < 0 || fromIndex === toIndex) return;
      fireReorderColumn(node, columnId, toIndex);
    },
    [columns, handleDragEnd, node],
  );

  return (
    <div className="er-table" style={{ height }} key={snap.revision}>
      <div className="er-table-header" onContextMenu={onHeaderContextMenu}>
        <span className="er-table-name">{name}</span>
        {comment ? <span className="er-table-comment" title={comment}>?</span> : null}
      </div>
      <div className="er-table-fields">
        {columns.length === 0 ? (
          <div className="er-table-empty">No fields</div>
        ) : (
          columns.map((col, i) => (
            <FieldRow
              key={col.id}
              col={col}
              index={i}
              onFieldContextMenu={onFieldContextMenu}
              dragColumnId={dragColumnId}
              dropIndex={dropIndex}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))
        )}
      </div>
    </div>
  );
}
