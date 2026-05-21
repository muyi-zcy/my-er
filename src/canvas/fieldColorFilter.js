import { TABLE_SHAPE } from '../graph/constants';
import { refreshReactShapeView } from './tableNodeSync';

/**
 * 将颜色筛选状态同步到各表节点（仅影响 React 视图中的颜色标记，不改变字段行与端口布局）。
 * @param {import('@antv/x6').Graph} graph
 * @param {string | null} fieldColorFilter
 */
export function applyFieldColorFilter(graph, fieldColorFilter) {
  graph.getNodes().forEach((node) => {
    if (node.shape !== TABLE_SHAPE) return;
    const prev = node.getData() || {};
    node.replaceData({
      ...prev,
      fieldColorFilter: fieldColorFilter || null,
      revision: (prev.revision ?? 0) + 1,
    });
    refreshReactShapeView(graph, node);
  });
}
