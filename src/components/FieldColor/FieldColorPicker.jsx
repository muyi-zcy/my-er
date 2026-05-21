import { useState } from 'react';
import { MORANDI_COLORS, normalizeFieldColor } from '../../constants/fieldColors';
import './fieldColorPicker.css';

/**
 * @param {{
 *   value?: string,
 *   onChange: (color: string | null) => void,
 *   compact?: boolean,
 * }} props
 */
export default function FieldColorPicker({ value, onChange, compact = false }) {
  const [custom, setCustom] = useState(value || '#9CAF88');

  const select = (color) => {
    const normalized = normalizeFieldColor(color);
    if (normalized) onChange(normalized);
  };

  return (
    <div className={`field-color-picker${compact ? ' compact' : ''}`}>
      <div className="field-color-swatches" role="listbox" aria-label="莫兰迪配色">
        {MORANDI_COLORS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            role="option"
            aria-selected={value === preset.value}
            className={`field-color-swatch${value === preset.value ? ' selected' : ''}`}
            title={preset.label}
            style={{ backgroundColor: preset.value }}
            onClick={() => select(preset.value)}
          />
        ))}
      </div>
      <div className="field-color-custom">
        <label className="field-color-custom-label" htmlFor="field-color-custom-input">
          自定义
        </label>
        <input
          id="field-color-custom-input"
          type="color"
          value={normalizeFieldColor(custom) || custom}
          onChange={(e) => {
            setCustom(e.target.value);
            select(e.target.value);
          }}
        />
        <button
          type="button"
          className="field-color-apply-custom"
          onClick={() => select(custom)}
        >
          应用
        </button>
      </div>
      {value ? (
        <button type="button" className="field-color-clear" onClick={() => onChange(null)}>
          清除颜色
        </button>
      ) : null}
    </div>
  );
}
