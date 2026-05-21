import { Graph } from '@antv/x6';
// 必须加载 node/view 副作用，否则 react-shape 基类未注册，表节点无法渲染
import '@antv/x6-react-shape/es/node';
import '@antv/x6-react-shape/es/view';
import { register } from '@antv/x6-react-shape';
import ERTableNode from '../components/TableNode/TableNode';
import TextAnnotationNode from '../components/TextAnnotationNode/TextAnnotationNode';
import {
  TABLE_SHAPE,
  TEXT_ANNOTATION_SHAPE,
  EDGE_SHAPE,
  NODE_WIDTH,
  TEXT_ANNOTATION_MIN_WIDTH,
  TEXT_ANNOTATION_MIN_HEIGHT,
} from './constants';
import {
  registerBezierConnectors,
  BEZIER_ROUTER,
  CONNECTOR_CUBIC,
} from './bezierConnectors';
import { buildRelationshipLabels } from './edgeLabels';
import { theme } from '../theme';

let registered = false;

export function registerErShapes() {
  if (registered) return;
  registered = true;

  registerBezierConnectors();

  register({
    shape: TABLE_SHAPE,
    width: NODE_WIDTH,
    height: 300,
    component: ERTableNode,
    effect: ['data', 'ports', 'size'],
  });

  register({
    shape: TEXT_ANNOTATION_SHAPE,
    width: TEXT_ANNOTATION_MIN_WIDTH,
    height: TEXT_ANNOTATION_MIN_HEIGHT,
    component: TextAnnotationNode,
    effect: ['data', 'size'],
  });

  // X6 3.x 无 isEdgeRegistered；第三个参数 force 覆盖已有注册
  Graph.registerEdge(
    EDGE_SHAPE,
    {
    inherit: 'edge',
    router: BEZIER_ROUTER,
    connector: { name: CONNECTOR_CUBIC, args: { direction: 'H' } },
    attrs: {
      line: {
        stroke: theme.edge,
        strokeWidth: 1.5,
        targetMarker: { name: 'classic', size: 7 },
      },
    },
    labels: buildRelationshipLabels({ cardinality: '1:N' }),
    },
    true,
  );
}
