import {
  NODE_WIDTH,
  HEADER_HEIGHT,
  FIELD_ROW_HEIGHT,
  TABLE_SHAPE,
  EDGE_SHAPE,
  tableHeight,
} from '../graph/constants';
import { resolveEndpointFromLayout } from '../graph/portResolver';
import { BEZIER_ROUTER, connectorForKind } from '../graph/bezierConnectors';
import { theme } from '../theme';

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
  const h = tableHeight(table.columns.length);
  return {
    x: col * (NODE_WIDTH + LAYOUT.spacingX),
    y: row * (h + LAYOUT.spacingY),
  };
}

/**
 * @param {import('./erDiagram').Column[]} columns
 */
export function buildTablePorts(columns) {
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
    { id: 'table-right', group: 'table', args: { x: '100%', y: HEADER_HEIGHT / 2 } },
    { id: 'table-bottom', group: 'table', args: { x: '50%', y: '100%' } },
    { id: 'table-left', group: 'table', args: { x: 0, y: HEADER_HEIGHT / 2 } },
  ];

  columns.forEach((col, i) => {
    const y = HEADER_HEIGHT + i * FIELD_ROW_HEIGHT + FIELD_ROW_HEIGHT / 2;
    items.push(
      { id: `field-${col.id}-left`, group: 'field-left', args: { y } },
      { id: `field-${col.id}-right`, group: 'field-right', args: { y } },
    );
  });

  return { groups: portGroups, items };
}

/**
 * @param {Relationship} rel
 */
function edgeLabel(cardinality) {
  return cardinality || '1:N';
}

/**
 * @param {ErDiagram} diagram
 */
export function diagramToGraph(diagram) {
  const positions = new Map();

  const nodes = diagram.tables.map((table, index) => {
    const pos = defaultPosition(table, index);
    positions.set(table.id, pos);
    const height = tableHeight(table.columns.length);
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

  const edges = diagram.relationships.map((rel) => ({
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
    labels: [
      {
        attrs: {
          text: {
            text: edgeLabel(rel.cardinality),
            fill: theme.edgeLabelText,
            fontSize: 11,
            fontWeight: 500,
          },
          rect: {
            fill: theme.edgeLabelBg,
            stroke: theme.border,
            strokeWidth: 1,
            rx: 4,
            ry: 4,
          },
        },
        position: 0.5,
      },
    ],
  }));

  return { nodes, edges };
}
