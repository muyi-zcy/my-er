import { NODE_WIDTH } from './constants';
import { applyEdgeConnector } from './bezierConnectors';

/**
 * @param {string | undefined} portId
 * @returns {string | undefined}
 */
export function parseColumnId(portId) {
  if (!portId || !portId.startsWith('field-')) return undefined;
  const match = portId.match(/^field-(.+)-(left|right|in|out)$/);
  return match ? match[1] : undefined;
}

/**
 * @param {number} nodeX
 * @param {number} otherX
 * @returns {'left' | 'right'}
 */
export function pickSideFromPositions(nodeX, otherX) {
  const nodeCx = nodeX + NODE_WIDTH / 2;
  const otherCx = otherX + NODE_WIDTH / 2;
  return otherCx >= nodeCx ? 'right' : 'left';
}

/**
 * @param {import('@antv/x6').Node} node
 * @param {import('@antv/x6').Node} otherNode
 * @returns {'left' | 'right'}
 */
export function pickSide(node, otherNode) {
  return pickSideFromPositions(node.getPosition().x, otherNode.getPosition().x);
}

/**
 * @param {string} columnId
 * @param {'left' | 'right'} side
 */
export function fieldPortId(columnId, side) {
  return `field-${columnId}-${side}`;
}

/**
 * @param {'left' | 'right'} side
 */
export function tablePortId(side) {
  return side === 'right' ? 'table-right' : 'table-left';
}

/**
 * @param {string} tableId
 * @param {import('@antv/x6').Node} node
 * @param {import('@antv/x6').Node} otherNode
 * @param {string | undefined} columnId
 */
export function resolveConnectionPort(tableId, node, otherNode, columnId) {
  const side = pickSide(node, otherNode);
  const portId = fieldPortId(columnId, side);
  const useField = columnId && node.getPorts().some((p) => p.id === portId);
  return {
    cell: tableId,
    port: useField ? portId : tablePortId(side),
  };
}

/**
 * @param {import('@antv/x6').Graph} graph
 * @param {string} tableId
 * @returns {Set<string>}
 */
export function getConnectedColumnIds(graph, tableId) {
  const node = graph.getCellById(tableId);
  if (!node?.isNode()) return new Set();

  /** @type {Set<string>} */
  const ids = new Set();
  graph.getConnectedEdges(node).forEach((edge) => {
    const source = edge.getSource();
    const target = edge.getTarget();
    const sourceId = typeof source.cell === 'string' ? source.cell : source.cell?.id;
    const targetId = typeof target.cell === 'string' ? target.cell : target.cell?.id;

    if (sourceId === tableId) {
      const colId = parseColumnId(source.port);
      if (colId) ids.add(colId);
    }
    if (targetId === tableId) {
      const colId = parseColumnId(target.port);
      if (colId) ids.add(colId);
    }
  });
  return ids;
}

/**
 * @param {import('@antv/x6').Edge} edge
 */
export function rerouteEdge(edge) {
  const sourceCell = edge.getSourceCell();
  const targetCell = edge.getTargetCell();
  if (!sourceCell?.isNode() || !targetCell?.isNode()) return;

  const sourceColId = parseColumnId(edge.getSource().port);
  const targetColId = parseColumnId(edge.getTarget().port);

  edge.setSource(
    resolveConnectionPort(sourceCell.id, sourceCell, targetCell, sourceColId),
  );
  edge.setTarget(
    resolveConnectionPort(targetCell.id, targetCell, sourceCell, targetColId),
  );
  applyEdgeConnector(edge);
}

/**
 * @param {import('@antv/x6').Graph} graph
 * @param {import('@antv/x6').Node} node
 */
export function rerouteNodeEdges(graph, node) {
  graph.getConnectedEdges(node).forEach(rerouteEdge);
}

/**
 * @param {import('@antv/x6').Graph} graph
 */
export function rerouteAllEdges(graph) {
  graph.getEdges().forEach(rerouteEdge);
}

/**
 * @param {{ tableId: string, columnId?: string }} endpoint
 * @param {{ tableId: string, columnId?: string }} other
 * @param {Map<string, { x: number, y: number }>} positions
 */
export function resolveEndpointFromLayout(endpoint, other, positions) {
  const nodeX = positions.get(endpoint.tableId)?.x ?? 0;
  const otherX = positions.get(other.tableId)?.x ?? 0;
  const side = pickSideFromPositions(nodeX, otherX);
  return {
    cell: endpoint.tableId,
    port: endpoint.columnId
      ? fieldPortId(endpoint.columnId, side)
      : tablePortId(side),
  };
}
