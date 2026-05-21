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
 * @property {string} [color] 字段标记色（#RRGGBB），用于分布可视化
 * @property {string} [defaultFieldId] 关联的默认字段模板 id
 */

/**
 * @typedef {Object} Table
 * @property {string} id
 * @property {string} name
 * @property {string} [comment]
 * @property {{ x: number, y: number }} position
 * @property {Column[]} columns
 * @property {boolean} [hidden] 为 true 时不在画布显示，仍保留在模型中
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
 * @typedef {Object} TextAnnotation
 * @property {string} id
 * @property {string} text
 * @property {{ x: number, y: number }} position
 * @property {number} [width]
 * @property {number} [height]
 */

/**
 * @typedef {Object} ErDiagram
 * @property {string} schemaVersion
 * @property {{
 *   name?: string,
 *   dialect?: string,
 *   defaultFields?: import('./defaultFields').DefaultField[],
 * }} [metadata]
 * @property {Table[]} tables
 * @property {Relationship[]} relationships
 * @property {TextAnnotation[]} [annotations] 画布文字描述
 */

export const SCHEMA_VERSION = '1.0.0';

/** @returns {ErDiagram} */
export function createEmptyDiagram() {
  return {
    schemaVersion: SCHEMA_VERSION,
    metadata: { name: 'untitled', dialect: 'mysql' },
    tables: [],
    relationships: [],
    annotations: [],
  };
}

/** @param {Column} column */
export function columnKeyType(column) {
  if (column.primaryKey) return 'primary';
  if (column.unique) return 'unique';
  return null;
}
