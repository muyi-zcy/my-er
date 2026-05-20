import { Graph, Path } from '@antv/x6';

/** 三次贝塞尔（X6 内置 smooth） */
export const CONNECTOR_CUBIC = 'smooth';

/** 二次贝塞尔（自定义） */
export const CONNECTOR_QUADRATIC = 'er-quadratic';

/** 直连路由，便于贝塞尔在端口间平滑连接 */
export const BEZIER_ROUTER = { name: 'normal' };

const DEFAULT_DIRECTION = 'H';

let registered = false;

/**
 * 二次贝塞尔：单控制点 Q 曲线，适合表级逻辑关系
 */
function quadraticConnector(sourcePoint, targetPoint, _routePoints, options = {}) {
  const path = new Path();
  path.appendSegment(Path.createSegment('M', sourcePoint));

  let direction = options.direction;
  if (!direction) {
    direction =
      Math.abs(sourcePoint.x - targetPoint.x) >=
      Math.abs(sourcePoint.y - targetPoint.y)
        ? 'H'
        : 'V';
  }

  if (direction === 'H') {
    const cx = (sourcePoint.x + targetPoint.x) / 2;
    path.quadTo(cx, sourcePoint.y, targetPoint.x, targetPoint.y);
  } else {
    const cy = (sourcePoint.y + targetPoint.y) / 2;
    path.quadTo(sourcePoint.x, cy, targetPoint.x, targetPoint.y);
  }

  return options.raw ? path : path.serialize();
}

export function registerBezierConnectors() {
  if (registered) return;
  registered = true;
  Graph.registerConnector(CONNECTOR_QUADRATIC, quadraticConnector, true);
}

/**
 * @param {import('../model/erDiagram').RelationshipKind | undefined} kind
 */
export function connectorForKind(kind) {
  if (kind === 'table-table') {
    return { name: CONNECTOR_QUADRATIC, args: { direction: DEFAULT_DIRECTION } };
  }
  return { name: CONNECTOR_CUBIC, args: { direction: DEFAULT_DIRECTION } };
}

/** @param {import('@antv/x6').Edge} edge */
export function applyEdgeConnector(edge) {
  const kind = edge.getData()?.kind;
  edge.setRouter(BEZIER_ROUTER);
  edge.setConnector(connectorForKind(kind));
}
