export const TABLE_SHAPE = 'er-table';
export const TEXT_ANNOTATION_SHAPE = 'er-text-annotation';
export const EDGE_SHAPE = 'er-relationship';
export const TEXT_ANNOTATION_MIN_WIDTH = 120;
export const TEXT_ANNOTATION_MAX_WIDTH = 360;
export const TEXT_ANNOTATION_PADDING = 16;
export const TEXT_ANNOTATION_MIN_HEIGHT = 40;
export const TEXT_ANNOTATION_DEFAULT_TEXT = '文字描述';
export const NODE_WIDTH = 240;
export const HEADER_HEIGHT = 36;
/** 表头描述（comment）附加高度 */
export const HEADER_DESC_HEIGHT = 16;
export const FIELD_ROW_HEIGHT = 24;
/** 字段描述（comment）附加高度 */
export const FIELD_DESC_HEIGHT = 16;
export const BODY_PADDING = 12;
export const EMPTY_BODY_HEIGHT = 48;
/** 底部折叠条高度 */
export const FOOTER_HEIGHT = 16;

/**
 * @param {boolean} [hasComment]
 */
export function tableHeaderHeight(hasComment = false) {
  return hasComment ? HEADER_HEIGHT + HEADER_DESC_HEIGHT : HEADER_HEIGHT;
}

/**
 * @param {boolean} [hasComment]
 */
export function tableCollapsedHeight(hasComment = false) {
  return tableHeaderHeight(hasComment) + FOOTER_HEIGHT;
}

/**
 * @param {{ comment?: string }} column
 */
export function columnRowHeight(column) {
  return column.comment?.trim()
    ? FIELD_ROW_HEIGHT + FIELD_DESC_HEIGHT
    : FIELD_ROW_HEIGHT;
}

/**
 * @param {import('../model/erDiagram').Column[]} columns
 */
export function fieldsBodyHeight(columns) {
  return columns.reduce((sum, col) => sum + columnRowHeight(col), 0);
}

/**
 * @param {import('../model/erDiagram').Column[]} columns
 * @param {number} header
 * @returns {{ columnId: string, y: number }[]}
 */
export function fieldPortYPositions(columns, header) {
  const positions = [];
  let y = header;
  for (const col of columns) {
    const h = columnRowHeight(col);
    positions.push({ columnId: col.id, y: y + h / 2 });
    y += h;
  }
  return positions;
}

/**
 * @param {import('../model/erDiagram').Column[]} columns
 * @param {boolean} [collapsed]
 * @param {boolean} [hasTableComment]
 * @param {Set<string> | string[]} [connectedColumnIds] 折叠时仍展示的字段 id
 * @param {boolean} [showDefaultFields] 为 false 时不计入默认字段行高
 */
export function tableHeight(
  columns,
  collapsed = false,
  hasTableComment = false,
  connectedColumnIds,
  showDefaultFields = true,
) {
  const header = tableHeaderHeight(hasTableComment);
  const connectedSet =
    connectedColumnIds instanceof Set
      ? connectedColumnIds
      : connectedColumnIds
        ? new Set(connectedColumnIds)
        : null;

  /** @type {import('../model/erDiagram').Column[]} */
  let visibleColumns = columns;
  if (!showDefaultFields) {
    visibleColumns = visibleColumns.filter((c) => !c.defaultFieldId);
  }
  if (collapsed && connectedSet) {
    visibleColumns = visibleColumns.filter((c) => connectedSet.has(c.id));
  }

  if (collapsed) {
    if (visibleColumns.length <= 0) {
      return tableCollapsedHeight(hasTableComment);
    }
    return header + fieldsBodyHeight(visibleColumns) + FOOTER_HEIGHT;
  }
  if (visibleColumns.length === 0) {
    return header + EMPTY_BODY_HEIGHT + FOOTER_HEIGHT;
  }
  return header + fieldsBodyHeight(visibleColumns) + BODY_PADDING + FOOTER_HEIGHT;
}
