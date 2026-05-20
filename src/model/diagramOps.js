import { SCHEMA_VERSION } from './erDiagram';

/** @typedef {import('./erDiagram').ErDiagram} ErDiagram */
/** @typedef {import('./erDiagram').Table} Table */
/** @typedef {import('./erDiagram').Column} Column */

/**
 * @param {string[]} names
 * @param {string} base
 */
export function uniqueTableName(names, base = 'Table') {
  const used = new Set(names.map((n) => n.trim().toLowerCase()));
  let i = 1;
  let candidate = `${base}_${i}`;
  while (used.has(candidate.toLowerCase())) {
    i += 1;
    candidate = `${base}_${i}`;
  }
  return candidate;
}

/**
 * @param {string[]} ids
 * @param {string} base
 */
export function uniqueId(ids, base) {
  const used = new Set(ids);
  let candidate = base;
  let n = 1;
  while (used.has(candidate)) {
    candidate = `${base}_${n}`;
    n += 1;
  }
  return candidate;
}

/**
 * @param {Column[]} columns
 * @param {string} base
 */
export function uniqueColumnName(columns, base = 'column') {
  const used = new Set(columns.map((c) => c.name.trim().toLowerCase()));
  if (columns.length === 0 && !used.has('id')) {
    return 'id';
  }
  let i = 1;
  let candidate = `${base}_${i}`;
  while (used.has(candidate.toLowerCase())) {
    i += 1;
    candidate = `${base}_${i}`;
  }
  return candidate;
}

/**
 * @param {ErDiagram} diagram
 * @param {{ x: number, y: number }} position
 * @returns {Table}
 */
export function createTable(diagram, position) {
  const names = diagram.tables.map((t) => t.name);
  const ids = diagram.tables.map((t) => t.id);
  const name = uniqueTableName(names);
  const id = uniqueId(ids, name.replace(/\W+/g, '_').toLowerCase() || 'table');

  return {
    id,
    name,
    comment: '',
    position,
    columns: [],
  };
}

/**
 * @param {Table} table
 * @returns {Column}
 */
export function createColumn(table) {
  const ids = table.columns.map((c) => c.id);
  const name = uniqueColumnName(table.columns);
  const id = uniqueId(ids, name.replace(/\W+/g, '_').toLowerCase() || 'col');
  const isFirstId = table.columns.length === 0 && name === 'id';

  return {
    id,
    name,
    dataType: isFirstId ? 'bigint' : 'varchar(255)',
    nullable: !isFirstId,
    primaryKey: isFirstId,
    unique: false,
  };
}

/**
 * @param {unknown} raw
 * @returns {ErDiagram}
 */
export function normalizeDiagram(raw) {
  const d = /** @type {Record<string, unknown>} */ (raw && typeof raw === 'object' ? raw : {});
  return {
    schemaVersion: typeof d.schemaVersion === 'string' ? d.schemaVersion : SCHEMA_VERSION,
    metadata:
      d.metadata && typeof d.metadata === 'object'
        ? /** @type {ErDiagram['metadata']} */ (d.metadata)
        : { name: 'imported', dialect: 'mysql' },
    tables: Array.isArray(d.tables) ? /** @type {Table[]} */ (d.tables) : [],
    relationships: Array.isArray(d.relationships)
      ? /** @type {ErDiagram['relationships']} */ (d.relationships)
      : [],
  };
}
