import { theme } from '../theme';

/** 关系基数标签在 labels 数组中的下标 */
export const CARDINALITY_LABEL_INDEX = 0;

/**
 * @param {{ cardinality?: string, comment?: string }} params
 * @returns {import('@antv/x6').Edge.Label[]}
 */
export function buildRelationshipLabels({ cardinality = '1:N', comment }) {
  const card = cardinality || '1:N';
  const cardLabel = {
    position: 0.5,
    attrs: {
      text: {
        text: card,
        fill: theme.edgeLabelText,
        fontSize: 11,
        fontWeight: 600,
      },
      rect: {
        fill: theme.edgeLabelBg,
        stroke: theme.border,
        strokeWidth: 1,
        rx: 4,
        ry: 4,
      },
    },
  };

  const trimmed = comment?.trim();
  if (!trimmed) {
    return [cardLabel];
  }

  return [
    { ...cardLabel, position: 0.38 },
    {
      position: 0.62,
      attrs: {
        text: {
          text: trimmed,
          fill: theme.textSecondary,
          fontSize: 10,
          fontWeight: 400,
        },
        rect: {
          fill: theme.edgeLabelBg,
          stroke: theme.border,
          strokeWidth: 1,
          rx: 4,
          ry: 4,
        },
      },
    },
  ];
}

/**
 * @param {import('@antv/x6').Edge} edge
 */
export function applyRelationshipLabels(edge) {
  const data = edge.getData() || {};
  edge.setLabels(
    buildRelationshipLabels({
      cardinality: data.cardinality,
      comment: data.comment,
    }),
  );
}
