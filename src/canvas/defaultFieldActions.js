import { TABLE_SHAPE } from '../graph/constants';
import {
  columnPatchFromDefaultField,
  defaultFieldFromColumn,
  getDefaultFields,
  linkMatchingColumnsToDefaultField,
} from '../model/defaultFields';
import { uniqueId } from '../model/diagramOps';
import { syncTableNode } from './tableNodeSync';

/** @typedef {import('../model/erDiagram').ErDiagram} ErDiagram */
/** @typedef {import('../model/defaultFields').DefaultField} DefaultField */

/**
 * @param {ErDiagram} diagram
 * @returns {DefaultField[]}
 */
function ensureDefaultFieldsList(diagram) {
  if (!diagram.metadata) diagram.metadata = {};
  if (!Array.isArray(diagram.metadata.defaultFields)) {
    diagram.metadata.defaultFields = [];
  }
  return diagram.metadata.defaultFields;
}

/**
 * @param {ErDiagram} diagram
 * @param {import('@antv/x6').Graph} graph
 * @param {string} tableId
 * @param {string} columnId
 */
export function addColumnToDefaultFields(diagram, graph, tableId, columnId) {
  const table = diagram.tables.find((t) => t.id === tableId);
  if (!table) {
    return { ok: false, error: '表不存在' };
  }

  const column = table.columns.find((c) => c.id === columnId);
  if (!column) return { ok: false, error: '字段不存在' };

  const list = ensureDefaultFieldsList(diagram);
  const nameKey = column.name.trim().toLowerCase();
  let template = list.find((f) => f.name.trim().toLowerCase() === nameKey);

  if (column.defaultFieldId) {
    return { ok: false, error: '该字段已在默认字段中' };
  }

  if (!template) {
    const ids = list.map((f) => f.id);
    const baseId = column.name.replace(/\W+/g, '_').toLowerCase() || 'default_field';
    template = {
      id: uniqueId(ids, baseId),
      ...defaultFieldFromColumn(column),
    };
    list.push(template);
  }

  const affectedTableIds = linkMatchingColumnsToDefaultField(
    diagram,
    template.id,
    nameKey,
  );

  affectedTableIds.forEach((tid) => {
    const t = diagram.tables.find((x) => x.id === tid);
    const node = graph.getCellById(tid);
    if (!t || !node?.isNode() || node.shape !== TABLE_SHAPE) return;
    syncTableNode(graph, node, t, { portMode: 'none' });
  });

  return { ok: true, defaultFieldId: template.id };
}

/**
 * @param {ErDiagram} diagram
 * @param {import('@antv/x6').Graph} graph
 * @param {string} defaultFieldId
 * @param {Partial<DefaultField>} patch
 */
export function updateDefaultField(diagram, graph, defaultFieldId, patch) {
  const list = ensureDefaultFieldsList(diagram);
  const index = list.findIndex((f) => f.id === defaultFieldId);
  if (index < 0) return { ok: false, error: '默认字段不存在' };

  const prev = list[index];
  const nextName = (patch.name ?? prev.name).trim();
  if (!nextName) return { ok: false, error: '字段名不能为空' };

  const duplicate = list.some(
    (f) => f.id !== defaultFieldId && f.name.trim().toLowerCase() === nextName.toLowerCase(),
  );
  if (duplicate) return { ok: false, error: `默认字段名「${nextName}」已存在` };

  const nextComment =
    patch.comment !== undefined ? patch.comment.trim() : prev.comment?.trim() || '';

  const next = {
    ...prev,
    name: nextName,
    dataType: patch.dataType ?? prev.dataType,
    nullable: patch.nullable ?? prev.nullable,
    primaryKey: patch.primaryKey ?? prev.primaryKey,
    unique: patch.unique ?? prev.unique,
  };
  if (nextComment) {
    next.comment = nextComment;
  } else {
    delete next.comment;
  }
  if (patch.color !== undefined) {
    if (patch.color) next.color = patch.color;
    else delete next.color;
  }
  list[index] = next;

  const columnPatch = columnPatchFromDefaultField(next);
  const affectedTableIds = new Set();

  diagram.tables.forEach((table) => {
    let changed = false;
    table.columns.forEach((col) => {
      if (col.defaultFieldId !== defaultFieldId) return;
      Object.assign(col, columnPatch);
      if (!nextComment) delete col.comment;
      if (!next.color) delete col.color;
      changed = true;
    });
    if (changed) affectedTableIds.add(table.id);
  });

  affectedTableIds.forEach((tableId) => {
    const table = diagram.tables.find((t) => t.id === tableId);
    const node = graph.getCellById(tableId);
    if (!table || !node?.isNode()) return;
    syncTableNode(graph, node, table, { portMode: 'replace' });
  });

  return { ok: true };
}

/**
 * @param {ErDiagram} diagram
 * @param {import('@antv/x6').Graph} graph
 * @param {string} defaultFieldId
 */
export function removeDefaultField(diagram, graph, defaultFieldId) {
  const list = ensureDefaultFieldsList(diagram);
  const index = list.findIndex((f) => f.id === defaultFieldId);
  if (index < 0) return { ok: false, error: '默认字段不存在' };

  list.splice(index, 1);

  const affectedTableIds = new Set();
  diagram.tables.forEach((table) => {
    let changed = false;
    table.columns.forEach((col) => {
      if (col.defaultFieldId !== defaultFieldId) return;
      delete col.defaultFieldId;
      changed = true;
    });
    if (changed) affectedTableIds.add(table.id);
  });

  affectedTableIds.forEach((tableId) => {
    const table = diagram.tables.find((t) => t.id === tableId);
    const node = graph.getCellById(tableId);
    if (!table || !node?.isNode()) return;
    syncTableNode(graph, node, table, { portMode: 'replace' });
  });

  return { ok: true };
}

/**
 * @param {ErDiagram} diagram
 * @param {import('@antv/x6').Graph} graph
 * @param {string} tableId
 * @param {string} columnId
 */
export function unlinkColumnFromDefaultField(diagram, graph, tableId, columnId) {
  const table = diagram.tables.find((t) => t.id === tableId);
  const node = graph.getCellById(tableId);
  if (!table || !node || node.shape !== TABLE_SHAPE) {
    return { ok: false, error: '表不存在' };
  }

  const column = table.columns.find((c) => c.id === columnId);
  if (!column?.defaultFieldId) {
    return { ok: false, error: '该字段未关联默认字段' };
  }

  delete column.defaultFieldId;
  syncTableNode(graph, node, table, { portMode: 'none' });
  return { ok: true };
}

/**
 * @param {ErDiagram | null} diagram
 */
export function hasDefaultFields(diagram) {
  return getDefaultFields(diagram).length > 0;
}
