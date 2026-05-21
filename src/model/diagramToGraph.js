import {
  NODE_WIDTH,
  TABLE_SHAPE,
  TEXT_ANNOTATION_SHAPE,
  EDGE_SHAPE,
  tableHeight,
  tableHeaderHeight,
  fieldPortYPositions,
} from '../graph/constants';
import { measureAnnotationSize } from '../canvas/annotationActions';
import { resolveEndpointFromLayout } from '../graph/portResolver';
import { BEZIER_ROUTER, connectorForKind } from '../graph/bezierConnectors';
import { buildRelationshipLabels } from '../graph/edgeLabels';
import { theme } from '../theme';
import { getDisplayColumns } from './fieldDisplay';

/** @typedef {import('./erDiagram').ErDiagram} ErDiagram */
/** @typedef {import('./erDiagram').Table} Table */
/** @typedef {import('./erDiagram').Relationship} Relationship */

const LAYOUT = { cols: 2, spacingX: 100, spacingY: 80 };

/**
 * @param {Table} table
 * @param {number} index
 */
function defaultPosition(table, index) {
  if (table.position && (table.position.x || table.position.y)) {
    return table.position;
  }
  const row = Math.floor(index / LAYOUT.cols);
  const col = index % LAYOUT.cols;
  const h = tableHeight(table.columns);
  return {
    x: col * (NODE_WIDTH + LAYOUT.spacingX),
    y: row * (h + LAYOUT.spacingY),
  };
}

/**
 * @param {import('./erDiagram').Column[]} columns
 * @param {{
 *   collapsed?: boolean,
 *   hasComment?: boolean,
 *   connectedColumnIds?: Set<string>,
 *   displayColumns?: import('./erDiagram').Column[],
 * }} [options]
 */
export function buildTablePorts(columns, options = {}) {
  const collapsed = Boolean(options.collapsed);
  const hasComment = Boolean(options.hasComment);
  const connected = options.connectedColumnIds;
  const visibleColumns =
    options.displayColumns ??
    getDisplayColumns(columns, {
      collapsed,
      connectedColumnIds: connected ? [...connected] : [],
      showDefaultFields: true,
    });
  const header = tableHeaderHeight(hasComment);
  const nodeHeight = tableHeight(columns, collapsed, hasComment, collapsed ? connected : undefined);
  const tablePortY =
    collapsed && visibleColumns.length === 0 ? nodeHeight / 2 : header / 2;
  const portGroups = {
    table: {
      position: { name: 'absolute' },
      markup: [{ tagName: 'circle', selector: 'circle' }],
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: theme.portStroke,
          fill: theme.portFill,
          strokeWidth: 1.5,
        },
      },
    },
    'field-left': {
      position: { name: 'absolute', args: { x: 0 } },
      markup: [{ tagName: 'circle', selector: 'circle' }],
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: theme.portStroke,
          fill: theme.portFill,
          strokeWidth: 1.5,
        },
      },
    },
    'field-right': {
      position: { name: 'absolute', args: { x: '100%' } },
      markup: [{ tagName: 'circle', selector: 'circle' }],
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: theme.portStroke,
          fill: theme.portFill,
          strokeWidth: 1.5,
        },
      },
    },
  };

  const items = [
    { id: 'table-top', group: 'table', args: { x: '50%', y: 0 } },
    { id: 'table-right', group: 'table', args: { x: '100%', y: tablePortY } },
    { id: 'table-bottom', group: 'table', args: { x: '50%', y: '100%' } },
    { id: 'table-left', group: 'table', args: { x: 0, y: tablePortY } },
  ];

  const portColumns = collapsed ? visibleColumns : columns;
  const yByColumn = new Map(
    fieldPortYPositions(portColumns, header).map((p) => [p.columnId, p.y]),
  );
  portColumns.forEach((col) => {
    const y = yByColumn.get(col.id);
    if (y == null) return;
    items.push(
      { id: `field-${col.id}-left`, group: 'field-left', args: { y } },
      { id: `field-${col.id}-right`, group: 'field-right', args: { y } },
    );
  });

  return { groups: portGroups, items };
}

/**
 * @param {ErDiagram} diagram
 */
export function diagramToGraph(diagram) {
  const positions = new Map();
  const hiddenTableIds = new Set(
    diagram.tables.filter((t) => t.hidden).map((t) => t.id),
  );
  const visibleTables = diagram.tables.filter((t) => !t.hidden);

  const tableNodes = visibleTables.map((table, index) => {
    const pos = defaultPosition(table, index);
    positions.set(table.id, pos);
    const height = tableHeight(table.columns, false, Boolean(table.comment?.trim()));
    return {
      id: table.id,
      shape: TABLE_SHAPE,
      x: pos.x,
      y: pos.y,
      width: NODE_WIDTH,
      height,
      data: {
        tableId: table.id,
        name: table.name,
        comment: table.comment,
        columns: table.columns,
      },
      ports: buildTablePorts(table.columns),
    };
  });

  const annotationNodes = (diagram.annotations || []).map((ann) => {
    const { width, height } = measureAnnotationSize(ann.text);
    return {
      id: ann.id,
      shape: TEXT_ANNOTATION_SHAPE,
      x: ann.position?.x ?? 0,
      y: ann.position?.y ?? 0,
      width: ann.width ?? width,
      height: ann.height ?? height,
      data: {
        annotationId: ann.id,
        text: ann.text,
      },
    };
  });

  const nodes = [...tableNodes, ...annotationNodes];

  const edges = diagram.relationships
    .filter(
      (rel) =>
        !hiddenTableIds.has(rel.source.tableId) &&
        !hiddenTableIds.has(rel.target.tableId),
    )
    .map((rel) => ({
    id: rel.id,
    shape: EDGE_SHAPE,
    router: BEZIER_ROUTER,
    connector: connectorForKind(rel.kind),
    source: resolveEndpointFromLayout(rel.source, rel.target, positions),
    target: resolveEndpointFromLayout(rel.target, rel.source, positions),
    data: {
      relationshipId: rel.id,
      kind: rel.kind,
      cardinality: rel.cardinality || '1:N',
      comment: rel.comment,
    },
    labels: buildRelationshipLabels({
      cardinality: rel.cardinality,
      comment: rel.comment,
    }),
  }));

  return { nodes, edges };
}

