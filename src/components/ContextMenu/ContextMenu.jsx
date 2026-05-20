import { useEffect, useRef } from 'react';
import './ContextMenu.css';

/**
 * @typedef {{ id: string, label: string, danger?: boolean, disabled?: boolean }} MenuItem
 */

/**
 * @param {{
 *   x: number,
 *   y: number,
 *   items: MenuItem[],
 *   onSelect: (id: string) => void,
 *   onClose: () => void,
 * }} props
 */
export default function ContextMenu({ x, y, items, onSelect, onClose }) {
  const menuRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  useEffect(() => {
    const onPointerDown = (e) => {
      if (menuRef.current?.contains(/** @type {Node} */ (e.target))) return;
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
    const menu = menuRef.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    let left = x;
    let top = y;
    if (left + rect.width > window.innerWidth) {
      left = window.innerWidth - rect.width - 8;
    }
    if (top + rect.height > window.innerHeight) {
      top = window.innerHeight - rect.height - 8;
    }
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }, [x, y, items]);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: x, top: y }}
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          className={`context-menu-item${item.danger ? ' danger' : ''}`}
          disabled={item.disabled}
          onClick={() => {
            if (!item.disabled) onSelect(item.id);
            onClose();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
