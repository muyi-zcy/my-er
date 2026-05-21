import { useState } from 'react';
import { collectUsedFieldColors, MORANDI_COLORS } from '../../constants/fieldColors';
import './FieldColorDrawer.css';

const TABS = [
  { id: 'filter', label: '筛选' },
  { id: 'palette', label: '配色' },
];

/**
 * @param {{
 *   diagram: import('../../model/erDiagram').ErDiagram | null,
 *   activeColor: string | null,
 *   onFilterChange: (color: string | null) => void,
 * }} props
 */
export default function FieldColorDrawer({ diagram, activeColor, onFilterChange }) {
  const [tab, setTab] = useState('filter');
  const used = collectUsedFieldColors(diagram);

  return (
    <aside className="field-color-drawer" aria-label="字段颜色">
      <header className="field-color-drawer-header">
        <h2 className="field-color-drawer-title">字段颜色</h2>
      </header>

      <div className="field-color-drawer-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`field-color-drawer-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="field-color-drawer-body">
        {tab === 'filter' ? (
          <div className="field-color-drawer-panel" role="tabpanel">
            <p className="field-color-drawer-hint">
              选择一种颜色后，画布仍显示全部字段，仅高亮该颜色的标记，便于查看分布。
            </p>
            <div className="field-color-filter-list">
              <button
                type="button"
                className={`field-color-filter-chip${activeColor == null ? ' active' : ''}`}
                onClick={() => onFilterChange(null)}
              >
                全部显示
              </button>
              {used.length === 0 ? (
                <p className="field-color-drawer-empty">暂无已标记颜色的字段</p>
              ) : (
                used.map(({ color, count, label }) => (
                  <button
                    key={color}
                    type="button"
                    className={`field-color-filter-chip${activeColor === color ? ' active' : ''}`}
                    onClick={() => onFilterChange(activeColor === color ? null : color)}
                  >
                    <span className="field-color-filter-dot" style={{ backgroundColor: color }} />
                    <span className="field-color-filter-name">{label || color}</span>
                    <span className="field-color-filter-count">{count}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="field-color-drawer-panel" role="tabpanel">
            <p className="field-color-drawer-hint">
              莫兰迪预设色，可在字段右键「设置颜色」或编辑字段时选用。
            </p>
            <ul className="field-color-palette-list">
              {MORANDI_COLORS.map((preset) => (
                <li key={preset.id} className="field-color-palette-item">
                  <span
                    className="field-color-palette-swatch"
                    style={{ backgroundColor: preset.value }}
                  />
                  <span className="field-color-palette-label">{preset.label}</span>
                  <code className="field-color-palette-code">{preset.value}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
