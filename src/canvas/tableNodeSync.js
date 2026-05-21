import { buildTablePorts } from '../model/diagramToGraph';
import {
  NODE_WIDTH,
  tableHeight,
  tableHeaderHeight,
  fieldPortYPositions,
} from '../graph/constants';
import { getDisplayColumns } from '../model/fieldDisplay';
import { getConnectedColumnIds, rerouteNodeEdges } from '../graph/portResolver';

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
  const data = node.getData() || {};
  const columns = Array.isArray(data.columns) ? data.columns : [];
  const hasComment = Boolean(data.comment?.trim());
  const header = tableHeaderHeight(hasComment);
  const y = fieldPortYPositions(columns, header)[index]?.y;
  if (y == null) return;
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
 */
function applyCollapsedLayout(graph, node) {
  const prev = node.getData() || {};
  const columns = Array.isArray(prev.columns) ? prev.columns : [];
  const hasComment = Boolean(prev.comment?.trim());
  const connectedColumnIds = [...getConnectedColumnIds(graph, node.id)];
  const showDefaultFields = prev.showDefaultFields !== false;
  const displayColumns = getDisplayColumns(columns, {
    collapsed: true,
    connectedColumnIds,
    showDefaultFields,
  });

  node.replaceData({
    ...prev,
    collapsed: true,
    connectedColumnIds,
    revision: (prev.revision ?? 0) + 1,
  });

  node.resize(
    NODE_WIDTH,
    tableHeight(columns, true, hasComment, connectedColumnIds, showDefaultFields),
  );
  node.prop(
    'ports',
    buildTablePorts(columns, {
      collapsed: true,
      hasComment,
      connectedColumnIds: new Set(connectedColumnIds),
      displayColumns,
    }),
  );
  rerouteNodeEdges(graph, node);
  refreshReactShapeView(graph, node);
}

/**
 * @param {import('@antv/x6').Graph} graph
 * @param {string} tableId
 */
export function refreshCollapsedTableIfNeeded(graph, tableId) {
  const node = graph.getCellById(tableId);
  if (!node?.isNode() || !node.getData()?.collapsed) return;
  applyCollapsedLayout(graph, node);
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
  const collapsed = Boolean(prev.collapsed);
  const fieldColorFilter = prev.fieldColorFilter || null;
  const showDefaultFields = prev.showDefaultFields !== false;
  const hasComment = Boolean(table.comment?.trim());
  const connectedColumnIds = collapsed ? [...getConnectedColumnIds(graph, node.id)] : [];
  const displayColumns = getDisplayColumns(columns, {
    collapsed,
    connectedColumnIds,
    showDefaultFields,
  });
  node.replaceData({
    tableId: table.id,
    name: table.name,
    comment: table.comment || '',
    columns,
    collapsed,
    connectedColumnIds,
    fieldColorFilter,
    showDefaultFields,
    revision: (prev.revision ?? 0) + 1,
  });

  node.resize(
    NODE_WIDTH,
    tableHeight(columns, collapsed, hasComment, connectedColumnIds, showDefaultFields),
  );

  const applyPortsAndView = () => {
    if (portMode === 'append' && columns.length === prevColumnCount + 1 && !collapsed) {
      appendFieldPorts(node, columns[columns.length - 1], columns.length - 1);
    } else if (portMode !== 'none') {
      node.prop(
        'ports',
        buildTablePorts(columns, {
          collapsed,
          hasComment,
          connectedColumnIds: collapsed ? new Set(connectedColumnIds) : undefined,
          displayColumns,
        }),
      );
    }
    rerouteNodeEdges(graph, node);
    refreshReactShapeView(graph, node);
  };

  queueMicrotask(applyPortsAndView);
}

/**
 * @param {import('@antv/x6').Graph} graph
 * @param {import('@antv/x6').Node} node
 * @param {boolean} collapsed
 */
export function setTableCollapsed(graph, node, collapsed) {
  if (collapsed) {
    applyCollapsedLayout(graph, node);
    return;
  }

  const prev = node.getData() || {};
  const columns = Array.isArray(prev.columns) ? prev.columns : [];
  const hasComment = Boolean(prev.comment?.trim());

  node.replaceData({
    ...prev,
    collapsed: false,
    connectedColumnIds: [],
    revision: (prev.revision ?? 0) + 1,
  });
  const showDefaultFields = prev.showDefaultFields !== false;
  const displayColumns = getDisplayColumns(columns, { showDefaultFields });
  node.resize(NODE_WIDTH, tableHeight(columns, false, hasComment, undefined, showDefaultFields));
  node.prop('ports', buildTablePorts(columns, { collapsed: false, hasComment, displayColumns }));
  rerouteNodeEdges(graph, node);
  refreshReactShapeView(graph, node);
}
