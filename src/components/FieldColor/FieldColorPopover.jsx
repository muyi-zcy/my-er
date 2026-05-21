import { useEffect, useRef } from 'react';
import FieldColorPicker from './FieldColorPicker';
import './fieldColorPopover.css';

/**
 * @param {{
 *   x: number,
 *   y: number,
 *   value?: string,
 *   onChange: (color: string | null) => void,
 *   onClose: () => void,
 * }} props
 */
export default function FieldColorPopover({ x, y, value, onChange, onClose }) {
  const ref = useRef(/** @type {HTMLDivElement | null} */ (null));

  useEffect(() => {
    const onPointerDown = (e) => {
      if (ref.current?.contains(/** @type {Node} */ (e.target))) return;
      onClose();
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let left = x;
    let top = y;
    if (left + rect.width > window.innerWidth) {
      left = window.innerWidth - rect.width - 8;
    }
    if (top + rect.height > window.innerHeight) {
      top = window.innerHeight - rect.height - 8;
    }
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [x, y]);

  return (
    <div ref={ref} className="field-color-popover" style={{ left: x, top: y }} role="dialog">
      <p className="field-color-popover-title">字段颜色</p>
      <FieldColorPicker
        value={value}
        compact
        onChange={(color) => {
          onChange(color);
          onClose();
        }}
      />
    </div>
  );
}
