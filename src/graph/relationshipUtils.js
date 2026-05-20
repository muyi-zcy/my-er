/** @typedef {import('../model/erDiagram').RelationshipKind} RelationshipKind */

/**
 * @param {string | undefined} portId
 */
export function isFieldPort(portId) {
  return Boolean(portId && portId.startsWith('field-'));
}

/**
 * @param {string | undefined} portId
 */
export function isTablePort(portId) {
  return Boolean(portId && portId.startsWith('table-'));
}

/**
 * @param {string | undefined} sourcePort
 * @param {string | undefined} targetPort
 * @returns {RelationshipKind}
 */
export function inferRelationshipKind(sourcePort, targetPort) {
  const srcField = isFieldPort(sourcePort);
  const tgtField = isFieldPort(targetPort);
  if (!srcField && !tgtField) return 'table-table';
  if (srcField && tgtField) return 'field-field';
  return 'field-table';
}

/** @type {import('../model/erDiagram').Cardinality[]} */
export const CARDINALITY_CYCLE = ['1:1', '1:N', 'N:1', 'N:M'];

/**
 * @param {import('../model/erDiagram').Cardinality} current
 */
export function nextCardinality(current) {
  const idx = CARDINALITY_CYCLE.indexOf(current);
  const next = CARDINALITY_CYCLE[(idx + 1) % CARDINALITY_CYCLE.length];
  return next;
}
