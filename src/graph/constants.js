export const TABLE_SHAPE = 'er-table';
export const EDGE_SHAPE = 'er-relationship';
export const NODE_WIDTH = 240;
export const HEADER_HEIGHT = 36;
export const FIELD_ROW_HEIGHT = 24;
export const BODY_PADDING = 12;
export const EMPTY_BODY_HEIGHT = 48;

export function tableHeight(columnCount) {
  if (columnCount === 0) {
    return HEADER_HEIGHT + EMPTY_BODY_HEIGHT;
  }
  return HEADER_HEIGHT + columnCount * FIELD_ROW_HEIGHT + BODY_PADDING;
}
