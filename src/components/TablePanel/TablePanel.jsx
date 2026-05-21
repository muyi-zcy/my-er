import { useCallback, useState } from 'react';
import ContextMenu from '../ContextMenu/ContextMenu';
import './TablePanel.css';

/**
 * @typedef {import('../../model/erDiagram').Table} Table
 */

/**
 * @param {{
 *   tables: Table[],
 *   selectedTableId: string | null,
 *   onSelectTable: (tableId: string) => void,
 *   onToggleHidden: (tableId: string, hidden: boolean) => void,
 *   onEditTable?: (tableId: string) => void,
 * }} props
 */
export default function TablePanel({
  tables,
  selectedTableId,
  onSelectTable,
  onToggleHidden,
  onEditTable,
}) {
  const [contextMenu, setContextMenu] = useState(
    /** @type {{ x: number, y: number, tableId: string, hidden: boolean } | null} */ (null),
  );

  const handleRowContextMenu = useCallback((e, table) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tableId: table.id,
      hidden: Boolean(table.hidden),
    });
  }, []);

  const handleMenuSelect = useCallback(
    (actionId) => {
      const menu = contextMenu;
      if (!menu) return;
      const { tableId, hidden } = menu;
      setContextMenu(null);

      if (actionId === 'select-table') {
        onSelectTable(tableId);
        return;
      }
      if (actionId === 'edit-table') {
        onEditTable?.(tableId);
        return;
      }
      if (actionId === 'hide-table') {
        onToggleHidden(tableId, true);
        return;
      }
      if (actionId === 'show-table') {
        onToggleHidden(tableId, false);
      }
    },
    [contextMenu, onEditTable, onSelectTable, onToggleHidden],
  );

  const visibleCount = tables.filter((t) => !t.hidden).length;
  const hiddenCount = tables.length - visibleCount;

  return (
    <aside className="table-panel" aria-label="表列表">
      <header className="table-panel-header">
        <div className="table-panel-title-wrap">
          <h2 className="table-panel-title">表</h2>
          <span className="table-panel-count">
            {visibleCount}
            {hiddenCount > 0 ? ` / ${tables.length}` : ''}
          </span>
        </div>
      </header>

      <div className="table-panel-body">
        {tables.length === 0 ? (
          <p className="table-panel-empty">暂无表，在画布空白处右键可新建</p>
        ) : (
          <ul className="table-panel-list">
            {tables.map((table) => {
              const isHidden = Boolean(table.hidden);
              const isSelected = selectedTableId === table.id;
              return (
                <li key={table.id}>
                  <div
                    className={`table-panel-item${isSelected ? ' selected' : ''}${isHidden ? ' hidden-table' : ''}`}
                    role="button"
                    tabIndex={0}
                    title={
                      table.comment?.trim()
                        ? `${table.name}\n${table.comment}`
                        : table.name
                    }
                    onClick={() => onSelectTable(table.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectTable(table.id);
                      }
                    }}
                    onContextMenu={(e) => handleRowContextMenu(e, table)}
                  >
                    <div className="table-panel-item-main">
                      <span className="table-panel-item-name">{table.name}</span>
                      {table.comment?.trim() ? (
                        <span className="table-panel-item-desc">{table.comment}</span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className={`table-panel-visibility${isHidden ? ' is-hidden' : ''}`}
                      title={isHidden ? '显示于画布' : '从画布隐藏'}
                      aria-label={isHidden ? '显示于画布' : '从画布隐藏'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleHidden(table.id, !isHidden);
                      }}
                    >
                      {isHidden ? '◌' : '◉'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {contextMenu ? (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            { id: 'select-table', label: '定位到表' },
            ...(onEditTable ? [{ id: 'edit-table', label: '编辑表信息' }] : []),
            contextMenu.hidden
              ? { id: 'show-table', label: '显示于画布' }
              : { id: 'hide-table', label: '从画布隐藏' },
          ]}
          onSelect={handleMenuSelect}
          onClose={() => setContextMenu(null)}
        />
      ) : null}
    </aside>
  );
}
