import { buildTablePorts } from '../model/diagramToGraph';
import { TABLE_SHAPE, NODE_WIDTH, tableHeight, tableHeaderHeight } from '../graph/constants';
import { getDisplayColumns } from '../model/fieldDisplay';
import { getConnectedColumnIds, rerouteNodeEdges } from '../graph/portResolver';
import { refreshReactShapeView } from './tableNodeSync';

/**
 * 同步「是否显示默认字段」到各表节点（影响行展示、高度与端口）。
 * @param {import('@antv/x6').Graph} graph
 * @param {boolean} showDefaultFields
 */
export function applyDefaultFieldsVisibility(graph, showDefaultFields) {
  graph.getNodes().forEach((node) => {
    if (node.shape !== TABLE_SHAPE) return;
    const prev = node.getData() || {};
    const columns = Array.isArray(prev.columns) ? prev.columns : [];
    const collapsed = Boolean(prev.collapsed);
    const hasComment = Boolean(prev.comment?.trim());
    const connectedColumnIds = collapsed ? [...getConnectedColumnIds(graph, node.id)] : [];
    const displayColumns = getDisplayColumns(columns, {
      collapsed,
      connectedColumnIds,
      showDefaultFields,
    });

    node.replaceData({
      ...prev,
      showDefaultFields,
      revision: (prev.revision ?? 0) + 1,
    });

    node.resize(
      NODE_WIDTH,
      tableHeight(columns, collapsed, hasComment, connectedColumnIds, showDefaultFields),
    );
    node.prop(
      'ports',
      buildTablePorts(columns, {
        collapsed,
        hasComment,
        connectedColumnIds: collapsed ? new Set(connectedColumnIds) : undefined,
        displayColumns,
      }),
    );
    rerouteNodeEdges(graph, node);
    refreshReactShapeView(graph, node);
  });
}
