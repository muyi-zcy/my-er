import { diagramToGraph } from '../model/diagramToGraph';
import { reorderColumnList } from '../model/columnOrder';
import { syncTableNode } from './tableNodeSync';
import { uniqueId, uniqueTableName } from '../model/diagramOps';
import { isTableNameAvailable } from '../model/validateDiagram';
import { TABLE_SHAPE } from '../graph/constants';
import { normalizeFieldColor } from '../constants/fieldColors';

export { reorderColumnList } from '../model/columnOrder';

/** @typedef {import('../model/erDiagram').ErDiagram} ErDiagram */
/** @typedef {import('../model/erDiagram').Table} Table */
/** @typedef {import('../model/erDiagram').Column} Column */

/**
 * @param {string} name
 */
export function slugify(name) {
  return name.trim().replace(/\W+/g, '_').toLowerCase() || 'item';
}

/**
 * @param {Array<{ id?: string, name: string, dataType: string, comment?: string }>} rows
 * @param {Column[]} [existingColumns]
 * @returns {{ columns: Column[], error?: string }}
 */
export function buildColumnsFromRows(rows, existingColumns = []) {
  const columns = [];
  const usedIds = [];
  const usedNames = new Set();

  for (const row of rows) {
    const name = row.name.trim();
    if (!name) continue;

    const nameKey = name.toLowerCase();
    if (usedNames.has(nameKey)) {
      return { columns: [], error: `字段名重复：${name}` };
    }
    usedNames.add(nameKey);

    const existing = row.id ? existingColumns.find((c) => c.id === row.id) : null;
    const id = existing?.id || uniqueId(usedIds, slugify(name));
    usedIds.push(id);

    const isIdField = name === 'id' && columns.length === 0 && !existing;
    const comment = (row.comment ?? existing?.comment ?? '').trim();
    columns.push({
      id,
      name,
      dataType: row.dataType?.trim() || 'varchar(255)',
      nullable: existing ? existing.nullable ?? true : !isIdField,
      primaryKey: existing?.primaryKey ?? isIdField,
      unique: existing?.unique ?? false,
      defaultValue: existing?.defaultValue,
      ...(comment ? { comment } : {}),
      ...(existing?.color ? { color: existing.color } : {}),
    });
  }

  return { columns };
}

/**
 * @param {ErDiagram} diagram
 * @param {string} name
 * @param {string} [excludeTableId]
 */
export function validateTableName(diagram, name, excludeTableId) {
  const trimmed = name.trim();
  if (!trimmed) return '表编码不能为空';
  if (!isTableNameAvailable(diagram, trimmed, excludeTableId)) {
    return `表编码「${trimmed}」已存在`;
  }
  return null;
}

/**
 * @param {ErDiagram} diagram
 * @param {import('@antv/x6').Graph} graph
 * @param {{
 *   name: string,
 *   comment?: string,
 *   columns: Column[],
 *   position: { x: number, y: number },
 *   tableId?: string,
 * }} payload
 */
export function upsertTable(diagram, graph, payload) {
  const { name, comment = '', columns, position, tableId } = payload;
  const nameError = validateTableName(diagram, name, tableId);
  if (nameError) return { ok: false, error: nameError };

  const trimmedName = name.trim();

  if (tableId) {
    const table = diagram.tables.find((t) => t.id === tableId);
    if (!table) {
      return { ok: false, error: '表不存在' };
    }

    const node = graph.getCellById(tableId);
    const onCanvas = node?.isNode() && node.shape === TABLE_SHAPE;

    const removedColumnIds = table.columns
      .filter((c) => !columns.some((nc) => nc.id === c.id))
      .map((c) => c.id);

    table.name = trimmedName;
    table.comment = comment.trim();
    table.columns = columns;

    if (removedColumnIds.length > 0) {
      pruneRelationshipsForColumns(diagram, graph, tableId, removedColumnIds);
    }

    if (onCanvas) {
      syncTableNode(graph, node, table);
    }
    return { ok: true, tableId };
  }

  const ids = diagram.tables.map((t) => t.id);
  const id = uniqueId(ids, slugify(trimmedName));
  /** @type {Table} */
  const table = {
    id,
    name: trimmedName,
    comment: comment.trim(),
    position,
    columns,
  };

  diagram.tables.push(table);
  const { nodes } = diagramToGraph({ ...diagram, tables: [table], relationships: [] });
  const node = graph.addNode(nodes[0]);
  graph.select(node);
  return { ok: true, tableId: id };
}

/**
 * @param {ErDiagram} diagram
 * @param {import('@antv/x6').Graph} graph
 * @param {string} tableId
 * @param {Column} column
 */
export function addColumn(diagram, graph, tableId, column) {
  const table = diagram.tables.find((t) => t.id === tableId);
  const node = graph.getCellById(tableId);
  if (!table || !node || node.shape !== TABLE_SHAPE) {
    return { ok: false, error: '表不存在' };
  }

  const duplicate = table.columns.some(
    (c) => c.name.trim().toLowerCase() === column.name.trim().toLowerCase(),
  );
  if (duplicate) {
    return { ok: false, error: `字段名「${column.name}」已存在` };
  }

  const prevColumnCount = (node.getData()?.columns || []).length;
  const columns = [...(node.getData()?.columns || []).map((c) => ({ ...c })), { ...column }];
  table.columns = columns;
  syncTableNode(graph, node, table, { portMode: 'append', prevColumnCount });
  return { ok: true };
}

/**
 * @param {ErDiagram} diagram
 * @param {import('@antv/x6').Graph} graph
 * @param {string} tableId
 * @param {string} columnId
 * @param {Partial<Column>} patch
 */
export function updateColumn(diagram, graph, tableId, columnId, patch) {
  const table = diagram.tables.find((t) => t.id === tableId);
  const node = graph.getCellById(tableId);
  if (!table || !node || node.shape !== TABLE_SHAPE) {
    return { ok: false, error: '表不存在' };
  }

  const column = table.columns.find((c) => c.id === columnId);
  if (!column) return { ok: false, error: '字段不存在' };

  const nextName = (patch.name ?? column.name).trim();
  if (!nextName) return { ok: false, error: '字段名不能为空' };

  const duplicate = table.columns.some(
    (c) => c.id !== columnId && c.name.trim().toLowerCase() === nextName.toLowerCase(),
  );
  if (duplicate) return { ok: false, error: `字段名「${nextName}」已存在` };

  const nextComment =
    patch.comment !== undefined ? patch.comment.trim() : column.comment?.trim() || '';
  Object.assign(column, {
    name: nextName,
    dataType: patch.dataType ?? column.dataType,
    nullable: patch.nullable ?? column.nullable,
    primaryKey: patch.primaryKey ?? column.primaryKey,
    unique: patch.unique ?? column.unique,
  });
  if (nextComment) {
    column.comment = nextComment;
  } else {
    delete column.comment;
  }

  if (patch.color !== undefined) {
    const normalized = normalizeFieldColor(patch.color);
    if (normalized) {
      column.color = normalized;
    } else {
      delete column.color;
    }
  }

  syncTableNode(graph, node, table, { portMode: 'none' });
  return { ok: true };
}

/**
 * @param {ErDiagram} diagram
 * @param {import('@antv/x6').Graph} graph
 * @param {string} tableId
 * @param {string} columnId
 * @param {string | null | undefined} color
 */
export function setColumnColor(diagram, graph, tableId, columnId, color) {
  const normalized = color ? normalizeFieldColor(color) : undefined;
  return updateColumn(diagram, graph, tableId, columnId, {
    color: normalized || '',
  });
}

/**
 * @param {ErDiagram} diagram
 * @param {import('@antv/x6').Graph} graph
 * @param {string} tableId
 * @param {string} columnId
 * @param {number} toIndex
 */
export function reorderColumn(diagram, graph, tableId, columnId, toIndex) {
  const table = diagram.tables.find((t) => t.id === tableId);
  const node = graph.getCellById(tableId);
  if (!table || !node || node.shape !== TABLE_SHAPE) {
    return { ok: false, error: '表不存在' };
  }

  const fromIndex = table.columns.findIndex((c) => c.id === columnId);
  if (fromIndex < 0) return { ok: false, error: '字段不存在' };
  if (toIndex < 0 || toIndex >= table.columns.length) {
    return { ok: false, error: '无效位置' };
  }
  if (fromIndex === toIndex) return { ok: true };

  table.columns = reorderColumnList(table.columns, fromIndex, toIndex);
  syncTableNode(graph, node, table, { portMode: 'replace' });
  return { ok: true };
}

/**
 * @param {ErDiagram} diagram
 * @param {import('@antv/x6').Graph} graph
 * @param {string} tableId
 * @param {string} columnId
 */
export function deleteColumn(diagram, graph, tableId, columnId) {
  const table = diagram.tables.find((t) => t.id === tableId);
  const node = graph.getCellById(tableId);
  if (!table || !node || node.shape !== TABLE_SHAPE) {
    return { ok: false, error: '表不存在' };
  }

  if (!table.columns.some((c) => c.id === columnId)) {
    return { ok: false, error: '字段不存在' };
  }

  table.columns = table.columns.filter((c) => c.id !== columnId);
  pruneRelationshipsForColumns(diagram, graph, tableId, [columnId]);
  syncTableNode(graph, node, table);
  return { ok: true };
}

/**
 * @param {ErDiagram} diagram
 * @param {import('@antv/x6').Graph} graph
 * @param {string} tableId
 * @param {string[]} columnIds
 */
function pruneRelationshipsForColumns(diagram, graph, tableId, columnIds) {
  const idSet = new Set(columnIds);
  const removedRelIds = [];

  diagram.relationships = diagram.relationships.filter((rel) => {
    const hitsSource =
      rel.source.tableId === tableId &&
      rel.source.columnId &&
      idSet.has(rel.source.columnId);
    const hitsTarget =
      rel.target.tableId === tableId &&
      rel.target.columnId &&
      idSet.has(rel.target.columnId);
    if (hitsSource || hitsTarget) {
      removedRelIds.push(rel.id);
      return false;
    }
    return true;
  });

  removedRelIds.forEach((relId) => {
    const edge = graph.getCellById(relId);
    if (edge) graph.removeCell(edge);
  });
}

/**
 * @param {ErDiagram} diagram
 * @param {{ x: number, y: number }} position
 */
export function defaultNewTableName(diagram) {
  return uniqueTableName(diagram.tables.map((t) => t.name));
}
