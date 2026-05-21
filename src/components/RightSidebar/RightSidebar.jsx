import TablePanel from '../TablePanel/TablePanel';
import FieldColorDrawer from '../FieldColor/FieldColorDrawer';
import DefaultFieldDrawer from '../DefaultField/DefaultFieldDrawer';
import './RightSidebar.css';

/** @typedef {'tables' | 'colors' | 'defaults'} RightDrawerId */

const RAIL_ITEMS = [
  {
    id: /** @type {RightDrawerId} */ ('tables'),
    label: '表',
    title: '表列表',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <rect x="3" y="4" width="18" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="11" width="18" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="18" width="18" height="2" rx="0.5" fill="currentColor" opacity="0.35" />
      </svg>
    ),
  },
  {
    id: /** @type {RightDrawerId} */ ('defaults'),
    label: '默',
    title: '默认字段',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <rect x="4" y="5" width="16" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="4" y="11" width="16" height="4" rx="1" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="4" y="17" width="16" height="2" rx="0.5" fill="currentColor" opacity="0.35" />
      </svg>
    ),
  },
  {
    id: /** @type {RightDrawerId} */ ('colors'),
    label: '色',
    title: '字段颜色',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <path
          d="M7 4h10a2 2 0 0 1 2 2v11.5a1.5 1.5 0 0 1-2.4 1.2L14 16.8l-2.6 2.4A1.5 1.5 0 0 1 9 18V6a2 2 0 0 1 2-2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="10" r="2.5" fill="currentColor" opacity="0.5" />
      </svg>
    ),
  },
];

/**
 * @param {{
 *   activeDrawer: RightDrawerId | null,
 *   onActiveDrawerChange: (id: RightDrawerId | null) => void,
 *   tables: {
 *     tables: import('../../model/erDiagram').Table[],
 *     selectedTableId: string | null,
 *     onSelectTable: (tableId: string) => void,
 *     onToggleHidden: (tableId: string, hidden: boolean) => void,
 *     onEditTable?: (tableId: string) => void,
 *   },
 *   colors: {
 *     diagram: import('../../model/erDiagram').ErDiagram | null,
 *     activeColor: string | null,
 *     onFilterChange: (color: string | null) => void,
 *   },
 *   defaults: {
 *     defaultFields: import('../../model/defaultFields').DefaultField[],
 *     showDefaultFields: boolean,
 *     onShowChange: (show: boolean) => void,
 *     onUpdate: (
 *       id: string,
 *       patch: Partial<import('../../model/defaultFields').DefaultField>,
 *     ) => void,
 *     onRemove: (id: string) => void,
 *   },
 * }} props
 */
export default function RightSidebar({
  activeDrawer,
  onActiveDrawerChange,
  tables,
  colors,
  defaults,
}) {
  const toggle = (id) => {
    onActiveDrawerChange(activeDrawer === id ? null : id);
  };

  return (
    <div className="right-sidebar">
      {activeDrawer ? (
        <div className="right-sidebar-panel">
          {activeDrawer === 'tables' ? (
            <TablePanel {...tables} />
          ) : activeDrawer === 'defaults' ? (
            <DefaultFieldDrawer {...defaults} />
          ) : (
            <FieldColorDrawer {...colors} />
          )}
        </div>
      ) : null}

      <nav className="right-sidebar-rail" aria-label="侧栏">
        {RAIL_ITEMS.map((item) => {
          const isActive = activeDrawer === item.id;
          return (
            <div key={item.id} className="right-sidebar-rail-item">
              {isActive ? (
                <span className="right-sidebar-rail-tab" aria-hidden>
                  {item.label}
                </span>
              ) : null}
              <button
                type="button"
                className={`right-sidebar-rail-btn${isActive ? ' active' : ''}`}
                title={item.title}
                aria-label={item.title}
                aria-pressed={isActive}
                onClick={() => toggle(item.id)}
              >
                {item.icon}
              </button>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
