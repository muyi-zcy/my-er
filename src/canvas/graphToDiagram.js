import { SCHEMA_VERSION } from '../model/erDiagram';
import { TABLE_SHAPE, TEXT_ANNOTATION_SHAPE } from '../graph/constants';
import { parseColumnId } from '../graph/portResolver';

/**
 * @param {import('@antv/x6').Graph} graph
 * @param {import('../model/erDiagram').ErDiagram} baseDiagram
 */
export function graphToDiagram(graph, baseDiagram) {
  const orderMap = new Map(baseDiagram.tables.map((t, i) => [t.id, i]));

  const onGraphTables = graph
    .getNodes()
    .filter((node) => node.shape === TABLE_SHAPE)
    .map((node) => {
    const data = node.getData() || {};
    const pos = node.getPosition();
    const existing = baseDiagram.tables.find((t) => t.id === node.id);

    return {
      id: node.id,
      name: data.name || existing?.name || node.id,
      comment: data.comment ?? existing?.comment,
      position: { x: pos.x, y: pos.y },
      columns: data.columns || existing?.columns || [],
      hidden: false,
    };
  });

  const graphTableIds = new Set(onGraphTables.map((t) => t.id));
  const hiddenTables = baseDiagram.tables
    .filter((t) => t.hidden && !graphTableIds.has(t.id))
    .map((t) => ({ ...t }));

  const tables = [...onGraphTables, ...hiddenTables].sort(
    (a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999),
  );

  const graphRelationships = graph.getEdges().map((edge) => {
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

  const graphRelIds = new Set(graphRelationships.map((r) => r.id));
  const preservedRelationships = baseDiagram.relationships.filter(
    (r) => !graphRelIds.has(r.id),
  );

  const annotationOrder = new Map(
    (baseDiagram.annotations || []).map((a, i) => [a.id, i]),
  );

  const onGraphAnnotations = graph
    .getNodes()
    .filter(
      (node) =>
        node.shape === TEXT_ANNOTATION_SHAPE && !node.getData()?.isDraft,
    )
    .map((node) => {
      const data = node.getData() || {};
      const pos = node.getPosition();
      const size = node.size();
      const existing = (baseDiagram.annotations || []).find((a) => a.id === node.id);
      return {
        id: node.id,
        text: data.text ?? existing?.text ?? '',
        position: { x: pos.x, y: pos.y },
        width: size.width,
        height: size.height,
      };
    });

  const annotations = onGraphAnnotations.sort(
    (a, b) => (annotationOrder.get(a.id) ?? 999) - (annotationOrder.get(b.id) ?? 999),
  );

  return {
    schemaVersion: baseDiagram.schemaVersion || SCHEMA_VERSION,
    metadata: baseDiagram.metadata,
    tables,
    relationships: [...graphRelationships, ...preservedRelationships],
    annotations,
  };
}
