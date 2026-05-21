import { isDefaultFieldColumn } from './defaultFields';

/** @typedef {import('./erDiagram').Column} Column */

/**
 * 决定表节点上展示哪些字段行（仅折叠时缩小范围；颜色筛选不影响行数）。
 * @param {Column[]} columns
 * @param {{
 *   collapsed?: boolean,
 *   connectedColumnIds?: string[],
 *   showDefaultFields?: boolean,
 * }} options
 */
export function getDisplayColumns(columns, options = {}) {
  const { collapsed, connectedColumnIds, showDefaultFields = true } = options;
  let visible = columns;
  if (!showDefaultFields) {
    visible = visible.filter((c) => !isDefaultFieldColumn(c));
  }
  if (collapsed) {
    const connected = new Set(connectedColumnIds || []);
    return visible.filter((c) => connected.has(c.id));
  }
  return visible;
}
