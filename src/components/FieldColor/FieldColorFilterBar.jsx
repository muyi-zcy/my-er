import { collectUsedFieldColors } from '../../constants/fieldColors';
import './fieldColorPicker.css';

/**
 * @param {{
 *   diagram: import('../../model/erDiagram').ErDiagram | null,
 *   activeColor: string | null,
 *   onFilterChange: (color: string | null) => void,
 * }} props
 */
export default function FieldColorFilterBar({ diagram, activeColor, onFilterChange }) {
  const used = collectUsedFieldColors(diagram);
  if (used.length === 0) return null;

  return (
    <div className="field-color-filter" role="group" aria-label="按字段颜色筛选">
      <span className="field-color-filter-label">字段颜色</span>
      <button
        type="button"
        className={`field-color-filter-chip${activeColor == null ? ' active' : ''}`}
        onClick={() => onFilterChange(null)}
      >
        全部
      </button>
      {used.map(({ color, count, label }) => (
        <button
          key={color}
          type="button"
          className={`field-color-filter-chip${activeColor === color ? ' active' : ''}`}
          title={`仅显示 ${label || color} 标记的字段`}
          onClick={() => onFilterChange(activeColor === color ? null : color)}
        >
          <span className="field-color-filter-dot" style={{ backgroundColor: color }} />
          {label || color}
          <span className="field-color-filter-count">{count}</span>
        </button>
      ))}
    </div>
  );
}
