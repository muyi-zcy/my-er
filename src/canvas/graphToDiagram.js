import { SCHEMA_VERSION } from '../model/erDiagram';
import { parseColumnId } from '../graph/portResolver';

/**
 * @param {import('@antv/x6').Graph} graph
 * @param {import('../model/erDiagram').ErDiagram} baseDiagram
 */
export function graphToDiagram(graph, baseDiagram) {
  const tables = graph.getNodes().map((node) => {
    const data = node.getData() || {};
    const pos = node.getPosition();
    const existing = baseDiagram.tables.find((t) => t.id === node.id);

    return {
      id: node.id,
      name: data.name || existing?.name || node.id,
      comment: data.comment ?? existing?.comment,
      position: { x: pos.x, y: pos.y },
      columns: data.columns || existing?.columns || [],
    };
  });

  const relationships = graph.getEdges().map((edge) => {
    const data = edge.getData() || {};
    const source = edge.getSource();
    const target = edge.getTarget();

    const sourceTableId = typeof source.cell === 'string' ? source.cell : source.cell?.id;
    const targetTableId = typeof target.cell === 'string' ? target.cell : target.cell?.id;

    return {
      id: data.relationshipId || edge.id,
      kind: data.kind || 'field-field',
      source: {
        tableId: sourceTableId,
        columnId: parseColumnId(source.port),
      },
      target: {
        tableId: targetTableId,
        columnId: parseColumnId(target.port),
      },
      cardinality: data.cardinality || '1:N',
      comment: data.comment,
    };
  });

  return {
    schemaVersion: baseDiagram.schemaVersion || SCHEMA_VERSION,
    metadata: baseDiagram.metadata,
    tables,
    relationships,
  };
}
