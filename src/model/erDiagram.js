/** @typedef {'table-table' | 'field-table' | 'field-field'} RelationshipKind */
/** @typedef {'1:1' | '1:N' | 'N:1' | 'N:M'} Cardinality */

/**
 * @typedef {Object} Column
 * @property {string} id
 * @property {string} name
 * @property {string} dataType
 * @property {boolean} [nullable]
 * @property {boolean} [primaryKey]
 * @property {boolean} [unique]
 * @property {string} [defaultValue]
 * @property {string} [comment]
 */

/**
 * @typedef {Object} Table
 * @property {string} id
 * @property {string} name
 * @property {string} [comment]
 * @property {{ x: number, y: number }} position
 * @property {Column[]} columns
 */

/**
 * @typedef {Object} RelationshipEndpoint
 * @property {string} tableId
 * @property {string} [columnId]
 */

/**
 * @typedef {Object} Relationship
 * @property {string} id
 * @property {RelationshipKind} kind
 * @property {RelationshipEndpoint} source
 * @property {RelationshipEndpoint} target
 * @property {Cardinality} [cardinality]
 * @property {string} [comment]
 */

/**
 * @typedef {Object} ErDiagram
 * @property {string} schemaVersion
 * @property {{ name?: string, dialect?: string }} [metadata]
 * @property {Table[]} tables
 * @property {Relationship[]} relationships
 */

export const SCHEMA_VERSION = '1.0.0';

/** @returns {ErDiagram} */
export function createEmptyDiagram() {
  return {
    schemaVersion: SCHEMA_VERSION,
    metadata: { name: 'untitled', dialect: 'mysql' },
    tables: [],
    relationships: [],
  };
}

/** @param {Column} column */
export function columnKeyType(column) {
  if (column.primaryKey) return 'primary';
  if (column.unique) return 'unique';
  return null;
}
