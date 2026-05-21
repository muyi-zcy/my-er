import { SCHEMA_VERSION } from '../model/erDiagram';
import { uniqueId } from '../model/diagramOps';

/** @typedef {import('../model/erDiagram').ErDiagram} ErDiagram */
/** @typedef {import('../model/erDiagram').Table} Table */
/** @typedef {import('../model/erDiagram').Column} Column */
/** @typedef {import('../model/erDiagram').Relationship} Relationship */

const TABLE_LAYOUT = { colWidth: 360, rowHeight: 280, originX: 40, originY: 40, cols: 4 };

/**
 * @param {string} sql
 * @returns {{ ok: true, diagram: ErDiagram } | { ok: false, error: string }}
 */
export function sqlToDiagram(sql) {
  const trimmed = String(sql || '').trim();
  if (!trimmed) {
    return { ok: false, error: 'SQL 内容为空' };
  }

  try {
    const cleaned = stripSqlComments(trimmed);
    const parsedTables = extractCreateTables(cleaned);
    if (parsedTables.length === 0) {
      return { ok: false, error: '未找到 CREATE TABLE 语句' };
    }

    /** @type {Map<string, Table>} */
    const tableByName = new Map();
    /** @type {Relationship[]} */
    const relationships = [];
    const relIds = [];

    parsedTables.forEach((parsed, index) => {
      const table = buildTable(parsed, index);
      tableByName.set(table.name.toLowerCase(), table);
      relationships.push(...buildRelationships(parsed, table, tableByName, relIds));
    });

    const tables = [...tableByName.values()];
    const diagram = {
      schemaVersion: SCHEMA_VERSION,
      metadata: { name: 'sql-import', dialect: 'mysql' },
      tables,
      relationships: dedupeRelationships(relationships),
    };

    return { ok: true, diagram };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SQL 解析失败';
    return { ok: false, error: message };
  }
}

/**
 * @param {string} sql
 */
function stripSqlComments(sql) {
  let out = '';
  let i = 0;
  while (i < sql.length) {
    if (sql.startsWith('--', i)) {
      i += 2;
      while (i < sql.length && sql[i] !== '\n') i += 1;
      continue;
    }
    if (sql.startsWith('/*', i)) {
      i += 2;
      while (i < sql.length - 1 && !(sql[i] === '*' && sql[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    out += sql[i];
    i += 1;
  }
  return out;
}

/**
 * @param {string} sql
 * @returns {ParsedCreateTable[]}
 */
function extractCreateTables(sql) {
  /** @type {ParsedCreateTable[]} */
  const results = [];
  const re = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+((?:`[^`]+`)|(?:[\w.]+))\s*\(/gi;
  let match = re.exec(sql);
  while (match) {
    const tableName = unquoteIdentifier(match[1]);
    const openParen = match.index + match[0].length - 1;
    const closeParen = findMatchingParen(sql, openParen);
    if (closeParen === -1) {
      throw new Error(`表「${tableName}」定义括号不匹配`);
    }
    const body = sql.slice(openParen + 1, closeParen);
    const tail = sql.slice(closeParen + 1, closeParen + 400);
    const comment = parseTableComment(tail);
    results.push(parseTableBody(tableName, body, comment));
    re.lastIndex = closeParen + 1;
    match = re.exec(sql);
  }
  return results;
}

/**
 * @typedef {Object} ParsedCreateTable
 * @property {string} name
 * @property {string} [comment]
 * @property {ParsedColumn[]} columns
 * @property {ParsedForeignKey[]} foreignKeys
 */

/**
 * @typedef {Object} ParsedColumn
 * @property {string} name
 * @property {string} dataType
 * @property {boolean} nullable
 * @property {boolean} primaryKey
 * @property {boolean} unique
 * @property {string} [defaultValue]
 * @property {string} [comment]
 */

/**
 * @typedef {Object} ParsedForeignKey
 * @property {string} column
 * @property {string} refTable
 * @property {string} refColumn
 */

/**
 * @param {string} tableName
 * @param {string} body
 * @param {string} [comment]
 * @returns {ParsedCreateTable}
 */
function parseTableBody(tableName, body, comment) {
  const lines = splitTopLevel(body);
  /** @type {Map<string, ParsedColumn>} */
  const columns = new Map();
  /** @type {ParsedForeignKey[]} */
  const foreignKeys = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const upper = trimmed.toUpperCase();

    if (upper.startsWith('PRIMARY KEY')) {
      applyPrimaryKey(columns, extractIdentifierList(trimmed));
      return;
    }

    if (upper.startsWith('UNIQUE KEY') || upper.startsWith('UNIQUE INDEX') || upper.startsWith('UNIQUE ')) {
      applyUnique(columns, extractIdentifierList(trimmed));
      return;
    }

    if (upper.startsWith('KEY ') || upper.startsWith('INDEX ') || upper.startsWith('FULLTEXT')) {
      return;
    }

    if (upper.startsWith('CONSTRAINT ') || upper.startsWith('FOREIGN KEY')) {
      const fk = parseForeignKey(trimmed);
      if (fk) foreignKeys.push(fk);
      return;
    }

    if (
      upper.startsWith('CHECK ') ||
      upper.startsWith('PARTITION ') ||
      upper === ')' ||
      upper.startsWith('ENGINE') ||
      upper.startsWith('DEFAULT CHARSET')
    ) {
      return;
    }

    const col = parseColumnLine(trimmed);
    if (col) columns.set(col.name.toLowerCase(), col);
  });

  if (columns.size === 0) {
    throw new Error(`表「${tableName}」未解析到任何字段`);
  }

  return {
    name: tableName,
    comment,
    columns: [...columns.values()],
    foreignKeys,
  };
}

/**
 * @param {string} line
 * @returns {ParsedColumn | null}
 */
function parseColumnLine(line) {
  const match = line.match(/^((?:`[^`]+`)|(?:[\w]+))\s+(.+)$/i);
  if (!match) return null;

  const name = unquoteIdentifier(match[1]);
  let rest = match[2].trim();

  const inlineComment = rest.match(/\s+COMMENT\s+(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")/i);
  const comment = inlineComment ? (inlineComment[1] ?? inlineComment[2] ?? '').replace(/\\'/g, "'") : undefined;
  if (inlineComment) {
    rest = rest.slice(0, inlineComment.index).trim();
  }

  const defaultMatch = rest.match(
    /\s+DEFAULT\s+(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"|((?:CURRENT_TIMESTAMP|NULL|\d+(?:\.\d+)?)))/i,
  );
  const defaultValue = defaultMatch
    ? (defaultMatch[1] ?? defaultMatch[2] ?? defaultMatch[3] ?? '').replace(/\\'/g, "'")
    : undefined;
  if (defaultMatch) {
    rest = rest.slice(0, defaultMatch.index).trim();
  }

  const nullable = !/\bNOT\s+NULL\b/i.test(rest);
  const primaryKey = /\bPRIMARY\s+KEY\b/i.test(rest);
  const unique = /\bUNIQUE\b/i.test(rest);

  let dataType = rest
    .replace(/\b(?:NOT\s+NULL|NULL|AUTO_INCREMENT|PRIMARY\s+KEY|UNIQUE|UNSIGNED|ZEROFILL)\b/gi, '')
    .replace(/\bON\s+UPDATE\s+CURRENT_TIMESTAMP(?:\(\d*\))?/gi, '')
    .replace(/\bCHARACTER\s+SET\s+\w+/gi, '')
    .replace(/\bCOLLATE\s+\w+/gi, '')
    .trim();

  const typeMatch = dataType.match(/^([\w]+(?:\s*\([^)]*\))?(?:\s+unsigned)?)/i);
  dataType = (typeMatch ? typeMatch[1] : dataType).trim().toLowerCase() || 'varchar(255)';

  return {
    name,
    dataType,
    nullable: primaryKey ? false : nullable,
    primaryKey,
    unique: unique && !primaryKey,
    defaultValue,
    comment,
  };
}

/**
 * @param {string} line
 * @returns {ParsedForeignKey | null}
 */
function parseForeignKey(line) {
  const match = line.match(
    /FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+((?:`[^`]+`)|(?:[\w.]+))\s*\(([^)]+)\)/i,
  );
  if (!match) return null;
  const cols = extractIdentifierList(`(${match[1]})`);
  const refCols = extractIdentifierList(`(${match[3]})`);
  if (cols.length === 0 || refCols.length === 0) return null;
  return {
    column: cols[0],
    refTable: unquoteIdentifier(match[2]),
    refColumn: refCols[0],
  };
}

/**
 * @param {Map<string, ParsedColumn>} columns
 * @param {string[]} names
 */
function applyPrimaryKey(columns, names) {
  names.forEach((name) => {
    const col = columns.get(name.toLowerCase());
    if (col) {
      col.primaryKey = true;
      col.nullable = false;
      col.unique = false;
    }
  });
}

/**
 * @param {Map<string, ParsedColumn>} columns
 * @param {string[]} names
 */
function applyUnique(columns, names) {
  names.forEach((name) => {
    const col = columns.get(name.toLowerCase());
    if (col && !col.primaryKey) col.unique = true;
  });
}

/**
 * @param {string} fragment
 * @returns {string[]}
 */
function extractIdentifierList(fragment) {
  const match = fragment.match(/\(([^)]*)\)/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((part) => unquoteIdentifier(part.trim()))
    .filter(Boolean);
}

/**
 * @param {string} body
 * @returns {string[]}
 */
function splitTopLevel(body) {
  /** @type {string[]} */
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    else if (ch === ',' && depth === 0) {
      parts.push(body.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(body.slice(start));
  return parts;
}

/**
 * @param {string} sql
 * @param {number} openIndex
 */
function findMatchingParen(sql, openIndex) {
  if (sql[openIndex] !== '(') return -1;
  let depth = 0;
  for (let i = openIndex; i < sql.length; i += 1) {
    if (sql[i] === '(') depth += 1;
    else if (sql[i] === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * @param {string} raw
 */
function unquoteIdentifier(raw) {
  const s = raw.trim();
  if ((s.startsWith('`') && s.endsWith('`')) || (s.startsWith('"') && s.endsWith('"'))) {
    return s.slice(1, -1);
  }
  const dot = s.lastIndexOf('.');
  return dot >= 0 ? s.slice(dot + 1) : s;
}

/**
 * @param {string} tail
 */
function parseTableComment(tail) {
  const match = tail.match(/\bCOMMENT\s*=\s*'((?:\\'|[^'])*)'|\bCOMMENT\s*=\s*"((?:\\"|[^"])*)"/i);
  if (!match) return '';
  return (match[1] ?? match[2] ?? '').replace(/\\'/g, "'");
}

/**
 * @param {ParsedCreateTable} parsed
 * @param {number} index
 * @returns {Table}
 */
function buildTable(parsed, index) {
  const col = index % TABLE_LAYOUT.cols;
  const row = Math.floor(index / TABLE_LAYOUT.cols);
  const tableId = sanitizeId(parsed.name);

  return {
    id: tableId,
    name: parsed.name,
    comment: parsed.comment || '',
    position: {
      x: TABLE_LAYOUT.originX + col * TABLE_LAYOUT.colWidth,
      y: TABLE_LAYOUT.originY + row * TABLE_LAYOUT.rowHeight,
    },
    columns: parsed.columns.map((c) => ({
      id: sanitizeId(c.name),
      name: c.name,
      dataType: c.dataType,
      nullable: c.nullable,
      primaryKey: c.primaryKey,
      unique: c.unique,
      ...(c.defaultValue !== undefined ? { defaultValue: c.defaultValue } : {}),
      ...(c.comment ? { comment: c.comment } : {}),
    })),
  };
}

/**
 * @param {ParsedCreateTable} parsed
 * @param {Table} table
 * @param {Map<string, Table>} tableByName
 * @param {string[]} relIds
 * @returns {Relationship[]}
 */
function buildRelationships(parsed, table, tableByName, relIds) {
  /** @type {Relationship[]} */
  const rels = [];

  parsed.foreignKeys.forEach((fk) => {
    const refTable = tableByName.get(fk.refTable.toLowerCase());
    if (!refTable) return;

    const sourceCol = table.columns.find((c) => c.name.toLowerCase() === fk.column.toLowerCase());
    const targetCol = refTable.columns.find((c) => c.name.toLowerCase() === fk.refColumn.toLowerCase());
    if (!sourceCol || !targetCol) return;

    const baseId = `${table.id}-${sourceCol.id}-${refTable.id}-${targetCol.id}`;
    const id = uniqueId(relIds, baseId);
    relIds.push(id);

    rels.push({
      id,
      kind: 'field-field',
      source: { tableId: table.id, columnId: sourceCol.id },
      target: { tableId: refTable.id, columnId: targetCol.id },
      cardinality: 'N:1',
      comment: `${table.name}.${sourceCol.name} → ${refTable.name}.${targetCol.name}`,
    });
  });

  return rels;
}

/**
 * @param {Relationship[]} relationships
 */
function dedupeRelationships(relationships) {
  const seen = new Set();
  return relationships.filter((rel) => {
    const key = `${rel.source.tableId}:${rel.source.columnId}->${rel.target.tableId}:${rel.target.columnId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * @param {string} name
 */
function sanitizeId(name) {
  const cleaned = name.replace(/\W+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
  return cleaned || 'table';
}
