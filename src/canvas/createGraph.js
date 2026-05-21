import { Graph } from '@antv/x6';
import { EDGE_SHAPE } from '../graph/constants';
import { buildRelationshipLabels } from '../graph/edgeLabels';
import { inferRelationshipKind } from '../graph/relationshipUtils';
import { cycleRelationshipCardinality } from './relationshipActions';
import { rerouteEdge, rerouteNodeEdges } from '../graph/portResolver';
import { refreshCollapsedTableIfNeeded } from './tableNodeSync';
import { BEZIER_ROUTER, CONNECTOR_CUBIC } from '../graph/bezierConnectors';
import { theme } from '../theme';

/**
 * @param {HTMLElement} container
 * @param {{ onDiagramChange?: () => void }} [options]
 */
export function createErGraph(container, options = {}) {
  const graph = new Graph({
    container,
    background: { color: theme.canvasBg },
    grid: { visible: true, type: 'dot', args: { color: theme.grid } },
    mousewheel: { enabled: true, modifiers: 'ctrl', minScale: 0.3, maxScale: 2 },
    panning: {
      enabled: true,
      eventTypes: ['leftMouseDown', 'rightMouseDown', 'mouseWheel'],
    },
    selecting: {
      enabled: true,
      multiple: false,
      rubberband: false,
      showNodeSelectionBox: true,
    },
    connecting: {
      snap: true,
      allowBlank: false,
      allowLoop: false,
      allowMulti: false,
      highlight: true,
      router: BEZIER_ROUTER,
      connector: { name: CONNECTOR_CUBIC, args: { direction: 'H' } },
      createEdge() {
        return graph.createEdge({
          shape: EDGE_SHAPE,
          router: BEZIER_ROUTER,
          connector: { name: CONNECTOR_CUBIC, args: { direction: 'H' } },
          data: { kind: 'field-field', cardinality: '1:N' },
          labels: buildRelationshipLabels({ cardinality: '1:N' }),
        });
      },
      validateMagnet({ magnet }) {
        return magnet != null;
      },
    },
  });

  graph.on('edge:connected', ({ edge, isNew }) => {
    if (!isNew || edge.shape !== EDGE_SHAPE) return;

    const source = edge.getSource();
    const target = edge.getTarget();
    const kind = inferRelationshipKind(source.port, target.port);
    const cardinality = '1:N';

    edge.setData({
      ...edge.getData(),
      relationshipId: edge.id,
      kind,
      cardinality,
    });
    edge.setLabels(buildRelationshipLabels({ cardinality }));

    if (kind === 'table-table') {
      edge.attr('line/strokeDasharray', '6 4');
    }

    rerouteEdge(edge);
    const sourceId = edge.getSourceCell()?.id;
    const targetId = edge.getTargetCell()?.id;
    if (sourceId) refreshCollapsedTableIfNeeded(graph, sourceId);
    if (targetId) refreshCollapsedTableIfNeeded(graph, targetId);
    options.onDiagramChange?.();
  });

  /** @type {Map<string, ReturnType<typeof setTimeout>>} */
  const edgeClickTimers = new Map();

  graph.on('edge:click', ({ edge, e }) => {
    if (edge.shape !== EDGE_SHAPE) return;
    e.stopPropagation();

    const edgeId = edge.id;
    const prev = edgeClickTimers.get(edgeId);
    if (prev) clearTimeout(prev);
    edgeClickTimers.set(
      edgeId,
      setTimeout(() => {
        edgeClickTimers.delete(edgeId);
        cycleRelationshipCardinality(edge);
        options.onDiagramChange?.();
      }, 280),
    );
  });

  graph.on('edge:dblclick', ({ edge, e }) => {
    if (edge.shape !== EDGE_SHAPE) return;
    e.stopPropagation();
    const prev = edgeClickTimers.get(edge.id);
    if (prev) {
      clearTimeout(prev);
      edgeClickTimers.delete(edge.id);
    }
    container.dispatchEvent(
      new CustomEvent('er-edge-comment-edit', {
        bubbles: false,
        detail: { edgeId: edge.id, clientX: e.clientX, clientY: e.clientY },
      }),
    );
  });

  graph.on('edge:mouseup', ({ edge, e }) => {
    if (edge.shape !== EDGE_SHAPE || e.button !== 2) return;
    e.preventDefault();
    e.stopPropagation();
    container.dispatchEvent(
      new CustomEvent('er-edge-contextmenu', {
        bubbles: false,
        detail: { edgeId: edge.id, clientX: e.clientX, clientY: e.clientY },
      }),
    );
  });

  graph.on('edge:mouseenter', ({ edge }) => {
    if (edge.shape !== EDGE_SHAPE) return;
    edge.attr('line/stroke', theme.edgeHover);
    edge.addTools([
      {
        name: 'button-remove',
        args: {
          distance: -40,
          markup: [
            {
              tagName: 'circle',
              selector: 'button',
              attrs: {
                r: 8,
                fill: theme.removeBtn,
                stroke: theme.surface,
                strokeWidth: 1.5,
                cursor: 'pointer',
              },
            },
            {
              tagName: 'text',
              selector: 'icon',
              textContent: '×',
              attrs: {
                fill: theme.surface,
                fontSize: 12,
                fontWeight: 600,
                textAnchor: 'middle',
                dominantBaseline: 'central',
              },
            },
          ],
        },
      },
    ]);
  });

  graph.on('edge:mouseleave', ({ edge }) => {
    if (edge.shape !== EDGE_SHAPE) return;
    const dash = edge.getData()?.kind === 'table-table' ? '6 4' : '';
    edge.attr('line/stroke', theme.edge);
    edge.attr('line/strokeDasharray', dash);
    edge.removeTools();
  });

  graph.on('node:moving', ({ node }) => {
    rerouteNodeEdges(graph, node);
  });

  graph.on('node:moved', ({ node }) => {
    rerouteNodeEdges(graph, node);
    options.onDiagramChange?.();
  });

  graph.on('edge:removed', ({ edge }) => {
    const sourceId = edge.getSourceCell()?.id;
    const targetId = edge.getTargetCell()?.id;
    options.onDiagramChange?.();
    if (sourceId) refreshCollapsedTableIfNeeded(graph, sourceId);
    if (targetId) refreshCollapsedTableIfNeeded(graph, targetId);
  });

  return graph;
}
