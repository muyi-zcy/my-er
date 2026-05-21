import { diagramToGraph } from '../model/diagramToGraph';
import { rerouteAllEdges } from '../graph/portResolver';
import { TABLE_SHAPE } from '../graph/constants';

/** @typedef {import('../model/erDiagram').ErDiagram} ErDiagram */

/**
 * @param {import('@antv/x6').Graph} graph
 */
function applyTableTableEdgeStyles(graph) {
  graph.getEdges().forEach((edge) => {
    if (edge.getData()?.kind === 'table-table') {
      edge.attr('line/strokeDasharray', '6 4');
    }
  });
}

/**
 * @param {ErDiagram} diagram
 * @param {import('@antv/x6').Graph} graph
 * @param {string} tableId
 * @param {boolean} hidden
 */
export function setTableHidden(diagram, graph, tableId, hidden) {
  const table = diagram.tables.find((t) => t.id === tableId);
  if (!table) return { ok: false, error: '表不存在' };

  if (Boolean(table.hidden) === hidden) return { ok: true };

  table.hidden = hidden;

  if (hidden) {
    const node = graph.getCellById(tableId);
    if (node?.isNode()) {
      const edges = graph.getConnectedEdges(node);
      graph.removeCells([node, ...edges]);
      graph.unselect(node);
    }
    return { ok: true };
  }

  const { nodes, edges } = diagramToGraph(diagram);
  const nodeDef = nodes.find((n) => n.id === tableId);
  if (!nodeDef) return { ok: true };

  const existing = graph.getCellById(tableId);
  if (!existing) {
    graph.addNode(nodeDef);
  }

  const hiddenIds = new Set(diagram.tables.filter((t) => t.hidden).map((t) => t.id));
  const edgeIdsOnGraph = new Set(graph.getEdges().map((e) => e.id));

  edges
    .filter((e) => !edgeIdsOnGraph.has(e.id))
    .filter((e) => {
      const src = /** @type {{ cell?: string }} */ (e.source).cell;
      const tgt = /** @type {{ cell?: string }} */ (e.target).cell;
      return src && tgt && !hiddenIds.has(src) && !hiddenIds.has(tgt);
    })
    .forEach((edgeDef) => {
      graph.addEdge(edgeDef);
    });

  rerouteAllEdges(graph);
  applyTableTableEdgeStyles(graph);

  const node = graph.getCellById(tableId);
  if (node?.isNode() && node.shape === TABLE_SHAPE) {
    graph.select(node);
    graph.centerCell(node);
  }

  return { ok: true };
}
