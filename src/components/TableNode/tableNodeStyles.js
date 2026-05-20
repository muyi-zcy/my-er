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
    padding: 8px 12px;
    font-weight: 600;
    font-size: 13px;
    text-align: center;
    border-bottom: 1px solid #e4e4e7;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 36px;
    box-sizing: border-box;
  }

  .er-table-name { flex: 1; }
  .er-table-comment {
    color: #a1a1aa;
    font-size: 11px;
    font-weight: 400;
    cursor: help;
  }

  .er-table-fields {
    flex: 1;
    overflow: hidden;
  }

  .er-table-empty {
    padding: 20px;
    text-align: center;
    color: #a1a1aa;
    font-size: 12px;
  }

  .er-table-field {
    display: flex;
    align-items: center;
    padding: 4px 4px 4px 2px;
    font-size: 11px;
    border-bottom: 1px solid #f4f4f5;
    min-height: 24px;
    box-sizing: border-box;
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
    width: 14px;
    margin-right: 2px;
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
    padding-left: 6px;
  }
  .er-table-field.unique { background-color: #f9fafb; }

  .er-field-badge {
    margin-right: 6px;
    font-size: 9px;
    font-weight: 600;
    color: #a1a1aa;
    min-width: 18px;
    text-align: center;
    letter-spacing: 0.02em;
  }
  .er-table-field.primary .er-field-badge { color: #71717a; }

  .er-field-name { flex: 1; font-weight: 500; color: #3f3f46; }
  .er-field-type {
    color: #a1a1aa;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 10px;
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
