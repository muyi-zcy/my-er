import { EDGE_SHAPE } from '../graph/constants';
import { applyRelationshipLabels } from '../graph/edgeLabels';
import { nextCardinality } from '../graph/relationshipUtils';

/**
 * @param {import('@antv/x6').Edge} edge
 */
export function cycleRelationshipCardinality(edge) {
  if (edge.shape !== EDGE_SHAPE) return null;
  const current = edge.getData()?.cardinality || '1:N';
  const next = nextCardinality(current);
  edge.setData({ ...edge.getData(), cardinality: next });
  applyRelationshipLabels(edge);
  return next;
}

/**
 * @param {import('@antv/x6').Edge} edge
 * @param {string} comment
 */
export function setRelationshipComment(edge, comment) {
  if (edge.shape !== EDGE_SHAPE) {
    return { ok: false, error: '连线不存在' };
  }
  const trimmed = comment.trim();
  const data = { ...edge.getData() };
  if (trimmed) {
    data.comment = trimmed;
  } else {
    delete data.comment;
  }
  edge.setData(data);
  applyRelationshipLabels(edge);
  return { ok: true };
}

/**
 * @param {import('@antv/x6').Graph} graph
 * @param {import('@antv/x6').Edge} edge
 */
export function getEdgeMidpointClient(graph, edge) {
  const bbox = edge.getBBox();
  return graph.localToClient({
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height / 2,
  });
}
