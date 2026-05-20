import { Graph } from '@antv/x6';
import { EDGE_SHAPE } from '../graph/constants';
import { inferRelationshipKind, nextCardinality } from '../graph/relationshipUtils';
import { rerouteEdge, rerouteNodeEdges } from '../graph/portResolver';
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
    panning: { enabled: true, eventTypes: ['leftMouseDown', 'rightMouseDown'] },
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
          labels: [
            {
              attrs: { text: { text: '1:N' } },
              position: 0.5,
            },
          ],
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
    edge.setLabels([
      {
        attrs: {
          text: {
            text: cardinality,
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
    ]);

    if (kind === 'table-table') {
      edge.attr('line/strokeDasharray', '6 4');
    }

    rerouteEdge(edge);
    options.onDiagramChange?.();
  });

  graph.on('edge:click', ({ edge, e }) => {
    if (edge.shape !== EDGE_SHAPE) return;
    e.stopPropagation();

    const current = edge.getData()?.cardinality || '1:N';
    const next = nextCardinality(current);
    edge.setData({ ...edge.getData(), cardinality: next });
    edge.setLabels([
      {
        attrs: {
          text: {
            text: next,
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
    ]);
    options.onDiagramChange?.();
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

  graph.on('edge:removed', () => {
    options.onDiagramChange?.();
  });

  return graph;
}
