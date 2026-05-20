/** @typedef {import('./erDiagram').Column} Column */

/**
 * @param {Column[]} columns
 * @param {number} fromIndex
 * @param {number} toIndex
 * @returns {Column[]}
 */
export function reorderColumnList(columns, fromIndex, toIndex) {
  if (fromIndex === toIndex) return columns.map((c) => ({ ...c }));
  const next = columns.map((c) => ({ ...c }));
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
