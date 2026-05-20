import { buildTablePorts } from '../model/diagramToGraph';
import { NODE_WIDTH, HEADER_HEIGHT, FIELD_ROW_HEIGHT, tableHeight } from '../graph/constants';
import { rerouteNodeEdges } from '../graph/portResolver';

/** @typedef {import('../model/erDiagram').Table} Table */
/** @typedef {import('../model/erDiagram').Column} Column */

/**
 * @param {import('@antv/x6').Graph} graph
 * @param {import('@antv/x6').Node} node
 */
export function refreshReactShapeView(graph, node) {
  const view = graph.findViewByCell(node);
  if (view && typeof view.renderReactComponent === 'function') {
    view.renderReactComponent();
  }
}

/**
 * @param {Column} column
 * @param {number} index
 */
export function appendFieldPorts(node, column, index) {
  const y = HEADER_HEIGHT + index * FIELD_ROW_HEIGHT + FIELD_ROW_HEIGHT / 2;
  node.addPorts([
    { id: `field-${column.id}-left`, group: 'field-left', args: { y } },
    { id: `field-${column.id}-right`, group: 'field-right', args: { y } },
  ]);
}

/**
 * @param {string} columnId
 */
export function removeFieldPorts(node, columnId) {
  node.removePorts([`field-${columnId}-left`, `field-${columnId}-right`]);
}

/**
 * @param {import('@antv/x6').Graph} graph
 * @param {import('@antv/x6').Node} node
 * @param {Table} table
 * @param {{ portMode?: 'append' | 'replace' | 'none', prevColumnCount?: number }} [options]
 */
export function syncTableNode(graph, node, table, options = {}) {
  const portMode = options.portMode || 'replace';
  const prevColumnCount = options.prevColumnCount ?? (node.getData()?.columns?.length ?? 0);

  const columns = table.columns.map((c) => ({ ...c }));
  table.columns = columns;

  const prev = node.getData() || {};
  node.replaceData({
    tableId: table.id,
    name: table.name,
    comment: table.comment || '',
    columns,
    revision: (prev.revision ?? 0) + 1,
  });

  node.resize(NODE_WIDTH, tableHeight(columns.length));

  const applyPortsAndView = () => {
    if (portMode === 'append' && columns.length === prevColumnCount + 1) {
      appendFieldPorts(node, columns[columns.length - 1], columns.length - 1);
    } else if (portMode !== 'none') {
      node.prop('ports', buildTablePorts(columns));
    }
    rerouteNodeEdges(graph, node);
    refreshReactShapeView(graph, node);
  };

  // 先提交 data，再在微任务中更新 ports / 刷新 React，避免 remount 读到旧 data
  queueMicrotask(applyPortsAndView);
}
