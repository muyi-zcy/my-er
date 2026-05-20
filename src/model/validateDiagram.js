/** @typedef {import('./erDiagram').ErDiagram} ErDiagram */

/**
 * @param {unknown} diagram
 * @returns {string[]}
 */
export function validateDiagram(diagram) {
  const errors = [];

  if (!diagram || typeof diagram !== 'object') {
    return ['无效的 ER 图：根对象必须是 JSON 对象'];
  }

  const d = /** @type {Record<string, unknown>} */ (diagram);

  if (!Array.isArray(d.tables)) {
    errors.push('缺少 tables 数组');
    return errors;
  }

  if (!Array.isArray(d.relationships)) {
    errors.push('缺少 relationships 数组');
    return errors;
  }

  const tableIds = new Set();
  const tableNames = new Map();

  d.tables.forEach((raw, index) => {
    if (!raw || typeof raw !== 'object') {
      errors.push(`tables[${index}] 不是有效对象`);
      return;
    }
    const table = /** @type {Record<string, unknown>} */ (raw);
    const id = typeof table.id === 'string' ? table.id.trim() : '';
    const name = typeof table.name === 'string' ? table.name.trim() : '';

    if (!id) {
      errors.push(`tables[${index}] 缺少 id`);
    } else if (tableIds.has(id)) {
      errors.push(`表 id 重复：${id}`);
    } else {
      tableIds.add(id);
    }

    if (!name) {
      errors.push(`表「${id || index}」缺少表编码（name）`);
    } else {
      const key = name.toLowerCase();
      if (tableNames.has(key)) {
        errors.push(`表编码重复：${name}（与 ${tableNames.get(key)} 冲突）`);
      } else {
        tableNames.set(key, id || name);
      }
    }

    if (!Array.isArray(table.columns)) {
      errors.push(`表「${name || id}」缺少 columns 数组`);
      return;
    }

    const columnIds = new Set();
    const columnNames = new Set();
    table.columns.forEach((colRaw, colIndex) => {
      if (!colRaw || typeof colRaw !== 'object') {
        errors.push(`表「${name}」columns[${colIndex}] 无效`);
        return;
      }
      const col = /** @type {Record<string, unknown>} */ (colRaw);
      const colId = typeof col.id === 'string' ? col.id.trim() : '';
      const colName = typeof col.name === 'string' ? col.name.trim() : '';
      if (!colId) {
        errors.push(`表「${name}」第 ${colIndex + 1} 个字段缺少 id`);
      } else if (columnIds.has(colId)) {
        errors.push(`表「${name}」字段 id 重复：${colId}`);
      } else {
        columnIds.add(colId);
      }
      if (!colName) {
        errors.push(`表「${name}」第 ${colIndex + 1} 个字段缺少 name`);
      } else {
        const colKey = colName.toLowerCase();
        if (columnNames.has(colKey)) {
          errors.push(`表「${name}」字段名重复：${colName}`);
        } else {
          columnNames.add(colKey);
        }
      }
    });
  });

  d.relationships.forEach((raw, index) => {
    if (!raw || typeof raw !== 'object') {
      errors.push(`relationships[${index}] 无效`);
      return;
    }
    const rel = /** @type {Record<string, unknown>} */ (raw);
    const source = rel.source;
    const target = rel.target;
    if (!source || typeof source !== 'object' || !target || typeof target !== 'object') {
      errors.push(`relationships[${index}] 缺少 source 或 target`);
      return;
    }
    const srcTableId = /** @type {{ tableId?: string }} */ (source).tableId;
    const tgtTableId = /** @type {{ tableId?: string }} */ (target).tableId;
    if (!srcTableId || !tableIds.has(srcTableId)) {
      errors.push(`relationships[${index}] 源表不存在：${srcTableId || '(空)'}`);
    }
    if (!tgtTableId || !tableIds.has(tgtTableId)) {
      errors.push(`relationships[${index}] 目标表不存在：${tgtTableId || '(空)'}`);
    }
  });

  return errors;
}

/**
 * @param {ErDiagram} diagram
 * @param {string} tableName
 * @param {string} [excludeTableId]
 * @returns {boolean}
 */
export function isTableNameAvailable(diagram, tableName, excludeTableId) {
  const key = tableName.trim().toLowerCase();
  if (!key) return false;
  return !diagram.tables.some(
    (t) => t.id !== excludeTableId && t.name.trim().toLowerCase() === key,
  );
}
