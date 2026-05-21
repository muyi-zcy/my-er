import {
  TEXT_ANNOTATION_SHAPE,
  TEXT_ANNOTATION_MIN_WIDTH,
  TEXT_ANNOTATION_MAX_WIDTH,
  TEXT_ANNOTATION_PADDING,
  TEXT_ANNOTATION_MIN_HEIGHT,
  TEXT_ANNOTATION_DEFAULT_TEXT,
} from '../graph/constants';
import { uniqueId } from '../model/diagramOps';

/** @typedef {import('../model/erDiagram').ErDiagram} ErDiagram */

/**
 * @param {string} text
 */
export function measureAnnotationSize(text) {
  const lines = String(text || '').split('\n');
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const charWidth = 8;
  const lineHeight = 20;
  const contentWidth = Math.min(
    TEXT_ANNOTATION_MAX_WIDTH - TEXT_ANNOTATION_PADDING,
    Math.max(40, longest * charWidth),
  );
  const width = Math.min(
    TEXT_ANNOTATION_MAX_WIDTH,
    Math.max(TEXT_ANNOTATION_MIN_WIDTH, contentWidth + TEXT_ANNOTATION_PADDING),
  );
  const innerWidth = width - TEXT_ANNOTATION_PADDING;
  const wrappedLines = lines.reduce((count, line) => {
    const segments = Math.max(1, Math.ceil(line.length / Math.max(1, Math.floor(innerWidth / charWidth))));
    return count + segments;
  }, 0);
  const height = Math.max(
    TEXT_ANNOTATION_MIN_HEIGHT,
    wrappedLines * lineHeight + TEXT_ANNOTATION_PADDING,
  );
  return { width, height };
}

/**
 * @param {import('@antv/x6').Graph} graph
 * @param {string} annotationId
 * @param {string} text
 */
export function syncAnnotationNodeSize(graph, annotationId, text) {
  const node = graph.getCellById(annotationId);
  if (!node?.isNode()) return;
  const { width, height } = measureAnnotationSize(text);
  node.resize(width, height);
}

/**
 * @param {import('@antv/x6').Graph} graph
 * @param {string} annotationId
 * @param {boolean} editing
 */
export function setAnnotationEditing(graph, annotationId, editing) {
  const node = graph.getCellById(annotationId);
  if (!node?.isNode() || node.shape !== TEXT_ANNOTATION_SHAPE) {
    return { ok: false, error: '文字描述不存在' };
  }
  node.setData({ ...node.getData(), editing });
  node.prop('movable', !editing);
  return { ok: true };
}

/**
 * @param {ErDiagram} diagram
 * @param {import('@antv/x6').Graph} graph
 * @param {{
 *   text?: string,
 *   position: { x: number, y: number },
 *   editing?: boolean,
 *   isDraft?: boolean,
 * }} params
 */
export function addAnnotation(diagram, graph, params) {
  const isDraft = Boolean(params.isDraft);
  const editing = Boolean(params.editing);
  const text = isDraft
    ? ''
    : (params.text ?? TEXT_ANNOTATION_DEFAULT_TEXT).trim() || TEXT_ANNOTATION_DEFAULT_TEXT;
  const existingIds = [
    ...diagram.tables.map((t) => t.id),
    ...(diagram.annotations || []).map((a) => a.id),
  ];
  const id = uniqueId(existingIds, 'note');
  const { width, height } = measureAnnotationSize(text || ' ');

  graph.addNode({
    id,
    shape: TEXT_ANNOTATION_SHAPE,
    x: params.position.x,
    y: params.position.y,
    width,
    height,
    data: { annotationId: id, text, editing, isDraft },
  });
  if (editing) {
    graph.getCellById(id)?.prop('movable', false);
  }

  return { ok: true, annotationId: id };
}

/**
 * @param {import('@antv/x6').Graph} graph
 * @param {string} annotationId
 * @param {string} text
 */
export function updateAnnotation(graph, annotationId, text) {
  const node = graph.getCellById(annotationId);
  if (!node?.isNode() || node.shape !== TEXT_ANNOTATION_SHAPE) {
    return { ok: false, error: '文字描述不存在' };
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: '内容不能为空' };
  }
  node.setData({ ...node.getData(), text: trimmed, editing: false, isDraft: false });
  node.prop('movable', true);
  syncAnnotationNodeSize(graph, annotationId, trimmed);
  return { ok: true };
}

/**
 * @param {import('@antv/x6').Graph} graph
 * @param {string} annotationId
 * @param {string} text
 */
export function commitAnnotation(graph, annotationId, text) {
  const node = graph.getCellById(annotationId);
  if (!node?.isNode() || node.shape !== TEXT_ANNOTATION_SHAPE) {
    return { ok: false, error: '文字描述不存在' };
  }
  const data = node.getData() || {};
  const trimmed = text.trim();

  if (!trimmed) {
    if (data.isDraft) {
      return deleteAnnotation(graph, annotationId);
    }
    node.setData({ ...data, editing: false });
    node.prop('movable', true);
    return { ok: true, kept: true };
  }

  return updateAnnotation(graph, annotationId, trimmed);
}

/**
 * @param {import('@antv/x6').Graph} graph
 * @param {string} annotationId
 */
export function cancelAnnotationEdit(graph, annotationId) {
  const node = graph.getCellById(annotationId);
  if (!node?.isNode() || node.shape !== TEXT_ANNOTATION_SHAPE) {
    return { ok: false, error: '文字描述不存在' };
  }
  const data = node.getData() || {};
  if (data.isDraft) {
    return deleteAnnotation(graph, annotationId);
  }
  node.setData({ ...data, editing: false });
  node.prop('movable', true);
  return { ok: true };
}

/**
 * @param {import('@antv/x6').Graph} graph
 * @param {string} annotationId
 */
export function deleteAnnotation(graph, annotationId) {
  const node = graph.getCellById(annotationId);
  if (!node?.isNode()) {
    return { ok: false, error: '文字描述不存在' };
  }
  graph.removeCell(node);
  return { ok: true };
}
