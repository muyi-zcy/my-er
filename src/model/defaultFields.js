/** @typedef {import('./erDiagram').ErDiagram} ErDiagram */
/** @typedef {import('./erDiagram').Column} Column */

/**
 * @typedef {Object} DefaultField
 * @property {string} id
 * @property {string} name
 * @property {string} dataType
 * @property {boolean} [nullable]
 * @property {boolean} [primaryKey]
 * @property {boolean} [unique]
 * @property {string} [defaultValue]
 * @property {string} [comment]
 * @property {string} [color]
 */

/**
 * @param {ErDiagram | null | undefined} diagram
 * @returns {DefaultField[]}
 */
export function getDefaultFields(diagram) {
  const list = diagram?.metadata?.defaultFields;
  return Array.isArray(list) ? list.map((f) => ({ ...f })) : [];
}

/**
 * @param {Column} column
 * @returns {Omit<DefaultField, 'id'>}
 */
export function defaultFieldFromColumn(column) {
  return {
    name: column.name,
    dataType: column.dataType,
    nullable: column.nullable,
    primaryKey: column.primaryKey,
    unique: column.unique,
    defaultValue: column.defaultValue,
    comment: column.comment,
    color: column.color,
  };
}

/**
 * @param {DefaultField} field
 * @returns {Partial<Column>}
 */
export function columnPatchFromDefaultField(field) {
  const patch = {
    name: field.name,
    dataType: field.dataType,
    nullable: field.nullable,
    primaryKey: field.primaryKey,
    unique: field.unique,
  };
  const comment = field.comment?.trim();
  if (comment) {
    patch.comment = comment;
  }
  if (field.defaultValue !== undefined && field.defaultValue !== '') {
    patch.defaultValue = field.defaultValue;
  }
  if (field.color) {
    patch.color = field.color;
  }
  return patch;
}

/**
 * @param {Column} column
 * @returns {boolean}
 */
export function isDefaultFieldColumn(column) {
  return Boolean(column.defaultFieldId);
}

/**
 * @param {Column} column
 * @param {string} nameKey 已 trim 且 toLowerCase 的字段名
 */
export function columnNameMatches(column, nameKey) {
  return column.name.trim().toLowerCase() === nameKey;
}

/**
 * 将各表中与默认字段同名的字段关联到该模板。
 * @param {ErDiagram} diagram
 * @param {string} defaultFieldId
 * @param {string} nameKey
 * @returns {Set<string>} 发生变更的 tableId
 */
export function linkMatchingColumnsToDefaultField(diagram, defaultFieldId, nameKey) {
  const affectedTableIds = new Set();
  diagram.tables.forEach((table) => {
    let changed = false;
    table.columns.forEach((col) => {
      if (!columnNameMatches(col, nameKey)) return;
      if (col.defaultFieldId === defaultFieldId) return;
      col.defaultFieldId = defaultFieldId;
      changed = true;
    });
    if (changed) affectedTableIds.add(table.id);
  });
  return affectedTableIds;
}
