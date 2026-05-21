import React, { useCallback, useEffect, useRef, useState } from 'react';
import { columnKeyType } from '../../model/erDiagram';
import { isDefaultFieldColumn } from '../../model/defaultFields';
import { columnRowHeight, tableHeight, tableHeaderHeight } from '../../graph/constants';
import { fieldColorBackground, resolveFieldColorDisplay } from '../../constants/fieldColors';
import { getDisplayColumns } from '../../model/fieldDisplay';

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
    collapsed: Boolean(data.collapsed),
    connectedColumnIds: Array.isArray(data.connectedColumnIds)
      ? data.connectedColumnIds
      : [],
    fieldColorFilter: data.fieldColorFilter || null,
    showDefaultFields: data.showDefaultFields !== false,
    revision: data.revision ?? 0,
  };
}

/**
 * @param {import('@antv/x6').Node} node
 */
function fireToggleCollapse(node) {
  const canvas = document.querySelector('.er-canvas');
  if (!canvas) return;
  canvas.dispatchEvent(
    new CustomEvent('er-toggle-collapse', {
      bubbles: false,
      detail: { tableId: node.id },
    }),
  );
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
 *   fieldColorFilter: string | null,
 *   onDragOver: (index: number) => void,
 *   onDrop: (index: number) => void,
 * }} props
 */
function FieldRow({
  col,
  index,
  fieldColorFilter,
  onFieldContextMenu,
  dragColumnId,
  dropIndex,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) {
  const keyType = columnKeyType(col);
  const isDefault = isDefaultFieldColumn(col);
  const hasFieldComment = Boolean(col.comment?.trim());
  const isDragging = dragColumnId === col.id;
  const isDropTarget = dropIndex === index && dragColumnId && dragColumnId !== col.id;
  const fieldColor = resolveFieldColorDisplay(col.color, fieldColorFilter);
  const colorBg = fieldColor ? fieldColorBackground(fieldColor) : undefined;

  return (
    <div
      data-column-id={col.id}
      className={`er-table-field ${index % 2 === 0 ? 'even' : 'odd'} ${keyType || ''}${isDefault ? ' is-default-field' : ''}${hasFieldComment ? ' has-desc' : ''}${fieldColor ? ' has-color' : ''}${isDragging ? ' dragging' : ''}${isDropTarget ? ' drop-target' : ''}`}
      style={{
        minHeight: columnRowHeight(col),
        ...(fieldColor
          ? {
              borderLeft: `3px solid ${fieldColor}`,
              paddingLeft: 2,
              backgroundColor: colorBg,
            }
          : {}),
      }}
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
      {isDefault ? (
        <span className="er-field-badge er-field-badge-default" title="默认字段">
          DF
        </span>
      ) : null}
      {keyType ? <span className="er-field-badge">{BADGES[keyType]}</span> : null}
      {fieldColor ? (
        <span
          className="er-field-color-dot"
          style={{ backgroundColor: fieldColor }}
          title="字段颜色"
          aria-hidden
        />
      ) : null}
      <div className="er-field-main">
        <div className="er-field-line">
          <span className="er-field-name">{col.name}</span>
          <span className="er-field-type">{col.dataType}</span>
        </div>
        {hasFieldComment ? (
          <p className="er-field-desc" title={col.comment}>
            {col.comment}
          </p>
        ) : null}
      </div>
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

  const { name, comment, columns, collapsed, connectedColumnIds, fieldColorFilter, showDefaultFields } =
    snap;
  const hasComment = Boolean(comment?.trim());
  const displayColumns = getDisplayColumns(columns, {
    collapsed,
    connectedColumnIds,
    showDefaultFields,
  });
  const height = tableHeight(
    columns,
    collapsed,
    hasComment,
    collapsed ? connectedColumnIds : undefined,
    showDefaultFields,
  );

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

  const onToggleCollapse = useCallback(
    (e) => {
      e.stopPropagation();
      fireToggleCollapse(node);
    },
    [node],
  );

  return (
    <div
      className={`er-table${collapsed ? ' collapsed' : ''}${fieldColorFilter ? ' color-filtered' : ''}${collapsed && displayColumns.length > 0 ? ' collapsed-partial' : ''}`}
      style={{ height }}
      key={snap.revision}
    >
      <div
        className={`er-table-header${hasComment ? ' has-desc' : ''}`}
        style={{ minHeight: tableHeaderHeight(hasComment) }}
        onContextMenu={onHeaderContextMenu}
      >
        <div className="er-table-header-main">
          <span className="er-table-name">{name}</span>
          {collapsed && columns.length > 0 ? (
            <span className="er-table-field-count">
              {displayColumns.length > 0 && displayColumns.length < columns.length
                ? `${displayColumns.length}/${columns.length}`
                : columns.length}
            </span>
          ) : null}
        </div>
        {hasComment ? (
          <p className="er-table-desc" title={comment}>
            {comment}
          </p>
        ) : null}
      </div>
      {!collapsed || displayColumns.length > 0 ? (
        <div className="er-table-fields">
          {!collapsed && columns.length === 0 ? (
            <div className="er-table-empty">No fields</div>
          ) : (
            displayColumns.map((col, i) => (
              <FieldRow
                key={col.id}
                col={col}
                index={i}
                fieldColorFilter={fieldColorFilter}
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
      ) : null}
      <div className="er-table-footer" onContextMenu={onHeaderContextMenu}>
        <button
          type="button"
          className="er-table-collapse-btn"
          title={collapsed ? '展开字段' : '折叠字段'}
          aria-label={collapsed ? '展开字段' : '折叠字段'}
          aria-expanded={!collapsed}
          onClick={onToggleCollapse}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="er-table-collapse-icon" aria-hidden>
            {collapsed ? '▴' : '▾'}
          </span>
        </button>
      </div>
    </div>
  );
}
