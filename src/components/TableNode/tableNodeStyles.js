import insertCss from 'insert-css';

let injected = false;

export function injectTableNodeStyles() {
  if (injected) return;
  injected = true;

  insertCss(`
  .er-table {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: #ffffff;
    border: 1px solid #e4e4e7;
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-sizing: border-box;
    overflow: hidden;
  }

  .er-table:hover {
    border-color: #d4d4d8;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  .er-table-header {
    background: #f4f4f5;
    color: #27272a;
    padding: 6px 10px;
    border-bottom: 1px solid #e4e4e7;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    gap: 2px;
    min-height: 36px;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .er-table-header-main {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 22px;
  }

  .er-table-name {
    font-weight: 600;
    font-size: 13px;
    line-height: 1.2;
    text-align: center;
    word-break: break-all;
  }

  .er-table-desc {
    margin: 0;
    font-size: 10px;
    font-weight: 400;
    color: #71717a;
    line-height: 1.35;
    text-align: center;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-word;
  }

  .er-table-fields {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .er-table.collapsed .er-table-header {
    border-bottom: none;
  }

  .er-table.collapsed-partial .er-table-header {
    border-bottom: 1px solid #e4e4e7;
  }

  .er-table-field-count {
    font-size: 10px;
    font-weight: 500;
    color: #a1a1aa;
    padding: 0 5px;
    border-radius: 8px;
    background: #f4f4f5;
    line-height: 16px;
  }

  .er-table-footer {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 16px;
    border-top: 1px solid #f4f4f5;
    opacity: 0.28;
    transition: opacity 0.15s ease;
  }

  .er-table:hover .er-table-footer,
  .er-table-footer:focus-within {
    opacity: 1;
  }

  .er-table-collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #d4d4d8;
    transition: color 0.15s ease;
  }

  .er-table-collapse-btn:hover {
    color: #71717a;
  }

  .er-table-collapse-btn:focus-visible {
    outline: none;
    color: #71717a;
  }

  .er-table-collapse-icon {
    font-size: 9px;
    line-height: 1;
    letter-spacing: 0;
    transform: scale(0.92, 0.75);
  }

  .er-table:hover .er-table-collapse-btn {
    color: #a1a1aa;
  }

  .er-table-empty {
    padding: 20px;
    text-align: center;
    color: #a1a1aa;
    font-size: 12px;
  }

  .er-table-field {
    display: flex;
    align-items: flex-start;
    padding: 4px 4px 4px 0;
    font-size: 11px;
    border-bottom: 1px solid #f4f4f5;
    min-height: 24px;
    box-sizing: border-box;
  }

  .er-table-field .er-field-drag,
  .er-table-field .er-field-badge {
    margin-top: 2px;
  }

  .er-table-field.dragging {
    opacity: 0.45;
  }

  .er-table-field.drop-target {
    background-color: #eff6ff;
    box-shadow: inset 0 2px 0 #2563eb;
  }

  .er-field-drag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    margin-right: 1px;
    font-size: 10px;
    line-height: 1;
    color: #d4d4d8;
    cursor: grab;
    user-select: none;
    flex-shrink: 0;
  }

  .er-field-drag:hover {
    color: #71717a;
  }

  .er-field-drag:active {
    cursor: grabbing;
  }

  .er-table-field:hover { background-color: #f4f4f5; }
  .er-table-field.drop-target:hover { background-color: #eff6ff; }
  .er-table-field.even { background-color: #fcfcfc; }
  .er-table-field:last-child { border-bottom: none; }
  .er-table-field.primary {
    background-color: #fafafa;
    border-left: 2px solid #d4d4d8;
    padding-left: 4px;
  }
  .er-table-field.unique { background-color: #f9fafb; }

  .er-field-color-dot {
    width: 8px;
    height: 8px;
    margin-right: 4px;
    margin-top: 4px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
  }

  .er-table-field.has-color .er-field-badge {
    margin-right: 4px;
  }

  .er-table-field.has-color:hover {
    filter: brightness(0.98);
  }

  .er-field-badge {
    margin-right: 4px;
    font-size: 9px;
    font-weight: 600;
    color: #a1a1aa;
    min-width: 16px;
    text-align: center;
    letter-spacing: 0.02em;
  }
  .er-table-field.primary .er-field-badge { color: #71717a; }
  .er-field-badge-default {
    background: #e0e7ff;
    color: #4338ca;
    font-size: 9px;
    letter-spacing: 0.02em;
  }

  .er-field-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .er-field-line {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 16px;
  }

  .er-field-name { flex: 1; font-weight: 500; color: #3f3f46; min-width: 0; }
  .er-field-type {
    flex-shrink: 0;
    color: #a1a1aa;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 10px;
  }

  .er-field-desc {
    margin: 0;
    font-size: 9px;
    font-weight: 400;
    color: #a1a1aa;
    line-height: 1.35;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-word;
  }
  .x6-port-body { opacity: 0; transition: opacity 0.15s ease; }
  .x6-node:hover .x6-port-body { opacity: 1; }
  .x6-port-body circle {
    fill: #fff;
    stroke: #d4d4d8;
    stroke-width: 1.5;
    cursor: crosshair;
  }
  .x6-port:hover .x6-port-body circle {
    fill: #f4f4f5;
    stroke: #a1a1aa;
    stroke-width: 2;
  }
  .x6-port-available .x6-port-body circle {
    fill: #fafafa;
    stroke: #71717a;
    stroke-width: 2;
  }
  .x6-edge:hover path:nth-child(2) { stroke: #52525b; }
`);
}
