import {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import { registerErShapes } from '../../graph/registerShapes';
import { injectTableNodeStyles } from '../TableNode/tableNodeStyles';
import { injectTextAnnotationNodeStyles } from '../TextAnnotationNode/textAnnotationNodeStyles';
import { diagramToGraph } from '../../model/diagramToGraph';
import { createErGraph } from '../../canvas/createGraph';
import { rerouteAllEdges } from '../../graph/portResolver';
import { graphToDiagram } from '../../canvas/graphToDiagram';
import {
  buildColumnsFromRows,
  upsertTable,
  addColumn,
  updateColumn,
  setColumnColor,
  deleteColumn,
  reorderColumn,
  defaultNewTableName,
  slugify,
} from '../../canvas/canvasActions';
import { validateDiagram } from '../../model/validateDiagram';
import { createEmptyDiagram } from '../../model/erDiagram';
import { uniqueId } from '../../model/diagramOps';
import { setTableCollapsed } from '../../canvas/tableNodeSync';
import { setTableHidden } from '../../canvas/tableVisibility';
import { applyFieldColorFilter } from '../../canvas/fieldColorFilter';
import { applyDefaultFieldsVisibility } from '../../canvas/defaultFieldVisibility';
import {
  addColumnToDefaultFields,
  updateDefaultField as syncDefaultFieldTemplate,
  removeDefaultField as removeDefaultFieldTemplate,
  unlinkColumnFromDefaultField,
} from '../../canvas/defaultFieldActions';
import {
  addAnnotation,
  setAnnotationEditing,
  commitAnnotation,
  cancelAnnotationEdit,
  deleteAnnotation,
} from '../../canvas/annotationActions';
import {
  cycleRelationshipCardinality,
  setRelationshipComment,
} from '../../canvas/relationshipActions';
import { TABLE_SHAPE } from '../../graph/constants';
import ContextMenu from '../ContextMenu/ContextMenu';
import TableFormDialog from '../Dialog/TableFormDialog';
import FieldFormDialog from '../Dialog/FieldFormDialog';
import EdgeCommentEditor from './EdgeCommentEditor';
import FieldColorPopover from '../FieldColor/FieldColorPopover';
import './ERCanvas.css';

/** @typedef {import('../../model/erDiagram').ErDiagram} ErDiagram */

/**
 * @typedef {Object} ERCanvasHandle
 * @property {() => ErDiagram | null} getDiagram
 * @property {(diagram: ErDiagram) => { ok: boolean, errors?: string[] }} load
 * @property {() => { ok: boolean, tableId?: string, error?: string }} addTable
 * @property {() => void} openCreateTableDialog
 * @property {() => { ok: boolean, error?: string }} addField
 * @property {(tableId: string, name: string) => { ok: boolean, error?: string }} setTableName
 * @property {() => string | null} getSelectedTableId
 * @property {(tableId: string) => void} selectTable
 * @property {(tableId: string, hidden: boolean) => { ok: boolean, error?: string }} setTableHidden
 * @property {(tableId: string) => void} openTableEdit
 */

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   items: Array<{ id: string, label: string, danger?: boolean, disabled?: boolean }>,
 *   payload: Record<string, unknown>,
 * }} ContextMenuState
 */

/**
 * @typedef {{
 *   edgeId: string,
 *   x: number,
 *   y: number,
 *   draft: string,
 * }} EdgeCommentEditState
 */

/**
 * @typedef {{
 *   type: 'table-create' | 'table-edit' | 'field-create' | 'field-edit',
 *   tableId?: string,
 *   columnId?: string,
 *   position?: { x: number, y: number },
 * }} DialogState
 */

/**
 * @typedef {{
 *   tableId: string,
 *   columnId: string,
 *   x: number,
 *   y: number,
 *   value?: string,
 * }} FieldColorPickerState
 */

/**
 * @param {import('@antv/x6').Graph} graph
 */
function applyTableTableEdgeStyles(graph) {
  graph.getEdges().forEach((edge) => {
    if (edge.getData()?.kind === 'table-table') {
      edge.attr('line/strokeDasharray', '6 4');
    }
  });
}

/**
 * @param {import('@antv/x6').Graph} graph
 */
function clientToGraphLocal(graph, clientX, clientY) {
  return graph.clientToLocal({ x: clientX, y: clientY });
}

/**
 * @param {import('@antv/x6').Graph} graph
 * @param {ErDiagram} diagram
 */
function renderDiagram(graph, diagram) {
  graph.clearCells();
  const { nodes, edges } = diagramToGraph(diagram);
  graph.fromJSON({ nodes, edges });
  rerouteAllEdges(graph);
  applyTableTableEdgeStyles(graph);
}

/**
 * @param {{
 *   diagramUrl?: string | null,
 *   onDiagramChange?: (diagram: ErDiagram) => void,
 *   onSelectionChange?: (tableId: string | null) => void,
 *   fieldColorFilter?: string | null,
 *   showDefaultFields?: boolean,
 * }} props
 * @param {React.Ref<ERCanvasHandle>} ref
 */
const ERCanvas = forwardRef(function ERCanvas(
  {
    diagramUrl = null,
    onDiagramChange,
    onSelectionChange,
    fieldColorFilter = null,
    showDefaultFields = true,
  },
  ref,
) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const diagramRef = useRef(/** @type {ErDiagram | null} */ (null));
  const selectedTableIdRef = useRef(/** @type {string | null} */ (null));
  const pendingPositionRef = useRef(/** @type {{ x: number, y: number } | null} */ (null));

  const [contextMenu, setContextMenu] = useState(/** @type {ContextMenuState | null} */ (null));
  const [edgeCommentEdit, setEdgeCommentEdit] = useState(
    /** @type {EdgeCommentEditState | null} */ (null),
  );
  const edgeCommentOriginalRef = useRef('');
  const [dialog, setDialog] = useState(/** @type {DialogState | null} */ (null));
  const [fieldColorPicker, setFieldColorPicker] = useState(
    /** @type {FieldColorPickerState | null} */ (null),
  );
  const [toast, setToast] = useState(/** @type {{ type: 'ok' | 'err', text: string } | null} */ (null));

  const onDiagramChangeRef = useRef(onDiagramChange);
  onDiagramChangeRef.current = onDiagramChange;
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const emitChange = useCallback(() => {
    const graph = graphRef.current;
    const base = diagramRef.current;
    if (!graph || !base) return;
    const diagram = graphToDiagram(graph, base);
    diagramRef.current = diagram;
    onDiagramChangeRef.current?.(diagram);
  }, []);

  const notifySelection = useCallback((tableId) => {
    selectedTableIdRef.current = tableId;
    onSelectionChangeRef.current?.(tableId);
  }, []);

  const openCreateTableDialogAt = useCallback((position) => {
    pendingPositionRef.current = position;
    setDialog({ type: 'table-create', position });
  }, []);

  const openEdgeCommentEdit = useCallback((edgeId, clientX, clientY) => {
    const graph = graphRef.current;
    const edge = graph?.getCellById(edgeId);
    if (!edge?.isEdge()) return;
    const draft = String(edge.getData()?.comment || '');
    edgeCommentOriginalRef.current = draft;
    graph.select(edge);
    setContextMenu(null);
    setEdgeCommentEdit({ edgeId, x: clientX, y: clientY, draft });
  }, []);

  const commitEdgeCommentEdit = useCallback(() => {
    const edit = edgeCommentEdit;
    if (!edit) return;
    const graph = graphRef.current;
    const edge = graph?.getCellById(edit.edgeId);
    if (edge?.isEdge()) {
      setRelationshipComment(edge, edit.draft);
      emitChange();
    }
    setEdgeCommentEdit(null);
  }, [edgeCommentEdit, emitChange]);

  const cancelEdgeCommentEdit = useCallback(() => {
    const edit = edgeCommentEdit;
    if (!edit) return;
    const graph = graphRef.current;
    const edge = graph?.getCellById(edit.edgeId);
    if (edge?.isEdge()) {
      setRelationshipComment(edge, edgeCommentOriginalRef.current);
    }
    setEdgeCommentEdit(null);
  }, [edgeCommentEdit]);

  const runTableFormSubmit = useCallback(
    (payload) => {
      const graph = graphRef.current;
      const base = diagramRef.current;
      if (!graph || !base) return;

      const isEdit = dialog?.type === 'table-edit';
      const existingTable = isEdit
        ? base.tables.find((t) => t.id === dialog?.tableId)
        : undefined;
      const built = buildColumnsFromRows(
        payload.fields,
        existingTable?.columns ?? [],
      );
      if (built.error) {
        showToast('err', built.error);
        return;
      }
      const position =
        pendingPositionRef.current ||
        (isEdit
          ? base.tables.find((t) => t.id === dialog?.tableId)?.position
          : null) || { x: 0, y: 0 };

      const result = upsertTable(base, graph, {
        name: payload.name,
        comment: payload.comment,
        columns: built.columns,
        position,
        tableId: isEdit ? dialog?.tableId : undefined,
      });

      if (!result.ok) {
        showToast('err', result.error || '保存失败');
        return;
      }

      setDialog(null);
      pendingPositionRef.current = null;
      if (result.tableId) {
        const node = graph.getCellById(result.tableId);
        if (node) graph.select(node);
        notifySelection(result.tableId);
      }
      emitChange();
      showToast('ok', isEdit ? '已更新表信息' : '已创建表');
    },
    [dialog, emitChange, notifySelection, showToast],
  );

  const runFieldFormSubmit = useCallback(
    (payload) => {
      const graph = graphRef.current;
      const base = diagramRef.current;
      if (!graph || !base || !dialog?.tableId) return;

      const table = base.tables.find((t) => t.id === dialog.tableId);
      if (!table) return;

      if (dialog.type === 'field-create') {
        const ids = table.columns.map((c) => c.id);
        const colId = uniqueId(ids, slugify(payload.name));
        const result = addColumn(base, graph, dialog.tableId, {
          id: colId,
          name: payload.name,
          dataType: payload.dataType,
          nullable: payload.nullable,
          primaryKey: payload.primaryKey,
          unique: payload.unique,
          ...(payload.comment ? { comment: payload.comment } : {}),
          ...(payload.color ? { color: payload.color } : {}),
        });
        if (!result.ok) {
          showToast('err', result.error || '添加失败');
          return;
        }
      } else if (dialog.columnId) {
        const result = updateColumn(base, graph, dialog.tableId, dialog.columnId, {
          name: payload.name,
          dataType: payload.dataType,
          comment: payload.comment,
          nullable: payload.nullable,
          primaryKey: payload.primaryKey,
          unique: payload.unique,
          color: payload.color ?? '',
        });
        if (!result.ok) {
          showToast('err', result.error || '保存失败');
          return;
        }
      }

      setDialog(null);
      emitChange();
      showToast('ok', dialog.type === 'field-create' ? '已添加字段' : '已更新字段');
    },
    [dialog, emitChange, showToast],
  );

  const handleContextMenuSelect = useCallback(
    (actionId) => {
      const menu = contextMenu;
      if (!menu) return;
      const { payload } = menu;

      if (actionId === 'create-table') {
        const graph = graphRef.current;
        if (!graph) return;
        const pos = clientToGraphLocal(
          graph,
          /** @type {number} */ (payload.clientX),
          /** @type {number} */ (payload.clientY),
        );
        openCreateTableDialogAt({ x: pos.x - 120, y: pos.y - 40 });
        return;
      }

      if (actionId === 'create-annotation') {
        const graph = graphRef.current;
        const base = diagramRef.current;
        if (!graph || !base) return;
        const pos = clientToGraphLocal(
          graph,
          /** @type {number} */ (payload.clientX),
          /** @type {number} */ (payload.clientY),
        );
        const result = addAnnotation(base, graph, {
          position: { x: pos.x - 60, y: pos.y - 20 },
          editing: true,
          isDraft: true,
        });
        if (!result.ok || !result.annotationId) return;
        const node = graph.getCellById(result.annotationId);
        if (node) graph.select(node);
        return;
      }

      const edgeId = /** @type {string | undefined} */ (payload.edgeId);
      if (edgeId) {
        const graph = graphRef.current;
        if (!graph) return;
        const edge = graph.getCellById(edgeId);
        if (!edge?.isEdge()) return;

        if (actionId === 'edit-edge-comment') {
          openEdgeCommentEdit(
            edgeId,
            /** @type {number} */ (payload.clientX),
            /** @type {number} */ (payload.clientY),
          );
          return;
        }

        if (actionId === 'cycle-edge-cardinality') {
          cycleRelationshipCardinality(edge);
          emitChange();
        }
        return;
      }

      const annotationId = /** @type {string | undefined} */ (payload.annotationId);
      if (annotationId) {
        const graph = graphRef.current;
        if (!graph) return;

        if (actionId === 'edit-annotation') {
          setAnnotationEditing(graph, annotationId, true);
          return;
        }

        if (actionId === 'delete-annotation') {
          const result = deleteAnnotation(graph, annotationId);
          if (!result.ok) {
            showToast('err', result.error || '删除失败');
            return;
          }
          emitChange();
          showToast('ok', '已删除文字描述');
        }
        return;
      }

      const tableId = /** @type {string | undefined} */ (payload.tableId);
      const columnId = /** @type {string | undefined} */ (payload.columnId);
      const base = diagramRef.current;
      const graph = graphRef.current;
      if (!tableId || !base || !graph) return;

      const table = base.tables.find((t) => t.id === tableId);
      if (!table) return;

      if (actionId === 'edit-table') {
        setDialog({ type: 'table-edit', tableId });
        return;
      }

      if (actionId === 'add-field') {
        setDialog({ type: 'field-create', tableId });
        return;
      }

      if (actionId === 'collapse-table' || actionId === 'expand-table') {
        const node = graph.getCellById(tableId);
        if (!node?.isNode()) return;
        setTableCollapsed(graph, node, actionId === 'collapse-table');
        return;
      }

      if (actionId === 'hide-table' || actionId === 'show-table') {
        const result = setTableHidden(
          base,
          graph,
          tableId,
          actionId === 'hide-table',
        );
        if (!result.ok) {
          showToast('err', result.error || '操作失败');
          return;
        }
        if (actionId === 'show-table') {
          notifySelection(tableId);
        } else {
          notifySelection(null);
        }
        emitChange();
        showToast('ok', actionId === 'hide-table' ? '已从画布隐藏' : '已在画布显示');
        return;
      }

      if (actionId === 'edit-field' && columnId) {
        setDialog({ type: 'field-edit', tableId, columnId });
        return;
      }

      if (actionId === 'add-to-default-fields' && columnId) {
        const result = addColumnToDefaultFields(base, graph, tableId, columnId);
        if (!result.ok) {
          showToast('err', result.error || '加入失败');
          return;
        }
        emitChange();
        showToast('ok', '已加入默认字段，各表同名字段已标记');
        return;
      }

      if (actionId === 'unlink-from-default-fields' && columnId) {
        const result = unlinkColumnFromDefaultField(base, graph, tableId, columnId);
        if (!result.ok) {
          showToast('err', result.error || '操作失败');
          return;
        }
        emitChange();
        showToast('ok', '已移出默认字段');
        return;
      }

      if (actionId === 'set-field-color' && columnId) {
        const column = table.columns.find((c) => c.id === columnId);
        setFieldColorPicker({
          tableId,
          columnId,
          x: menu.x,
          y: menu.y,
          value: column?.color,
        });
        return;
      }

      if (actionId === 'clear-field-color' && columnId) {
        const result = setColumnColor(base, graph, tableId, columnId, null);
        if (!result.ok) {
          showToast('err', result.error || '清除失败');
          return;
        }
        emitChange();
        showToast('ok', '已清除字段颜色');
        return;
      }

      if (actionId === 'delete-field' && columnId) {
        const result = deleteColumn(base, graph, tableId, columnId);
        if (!result.ok) {
          showToast('err', result.error || '删除失败');
          return;
        }
        emitChange();
        showToast('ok', '已删除字段');
        return;
      }

      if ((actionId === 'move-field-up' || actionId === 'move-field-down') && columnId) {
        const cols = table.columns;
        const fromIndex = cols.findIndex((c) => c.id === columnId);
        if (fromIndex < 0) return;
        const toIndex = actionId === 'move-field-up' ? fromIndex - 1 : fromIndex + 1;
        const result = reorderColumn(base, graph, tableId, columnId, toIndex);
        if (!result.ok) {
          showToast('err', result.error || '移动失败');
          return;
        }
        emitChange();
      }
    },
    [contextMenu, emitChange, notifySelection, openCreateTableDialogAt, openEdgeCommentEdit, showToast],
  );

  useImperativeHandle(ref, () => ({
    getDiagram() {
      const graph = graphRef.current;
      const base = diagramRef.current;
      if (!graph || !base) return null;
      return graphToDiagram(graph, base);
    },

    load(diagram) {
      const errors = validateDiagram(diagram);
      if (errors.length > 0) {
        return { ok: false, errors };
      }
      const graph = graphRef.current;
      if (!graph) return { ok: false, errors: ['画布未就绪'] };

      diagramRef.current = diagram;
      renderDiagram(graph, diagram);
      graph.centerContent();
      notifySelection(null);
      onDiagramChangeRef.current?.(diagram);
      return { ok: true };
    },

    getSelectedTableId() {
      return selectedTableIdRef.current;
    },

    openCreateTableDialog() {
      const graph = graphRef.current;
      if (!graph) return;
      const pos = clientToGraphLocal(
        graph,
        graph.container.getBoundingClientRect().left +
          graph.container.getBoundingClientRect().width / 2,
        graph.container.getBoundingClientRect().top +
          graph.container.getBoundingClientRect().height / 2,
      );
      openCreateTableDialogAt({ x: pos.x - 120, y: pos.y - 40 });
    },

    addTable() {
      const graph = graphRef.current;
      const base = diagramRef.current;
      if (!graph || !base) {
        return { ok: false, error: '画布未就绪' };
      }
      const pos = clientToGraphLocal(
        graph,
        graph.container.getBoundingClientRect().left +
          graph.container.getBoundingClientRect().width / 2,
        graph.container.getBoundingClientRect().top +
          graph.container.getBoundingClientRect().height / 2,
      );
      openCreateTableDialogAt({ x: pos.x - 120, y: pos.y - 40 });
      return { ok: true };
    },

    addField() {
      const tableId = selectedTableIdRef.current;
      if (!tableId) {
        return { ok: false, error: '请先选中一张表' };
      }
      setDialog({ type: 'field-create', tableId });
      return { ok: true };
    },

    setTableName(tableId, name) {
      const graph = graphRef.current;
      const base = diagramRef.current;
      if (!graph || !base) {
        return { ok: false, error: '画布未就绪' };
      }

      const table = base.tables.find((t) => t.id === tableId);
      if (!table) return { ok: false, error: '表不存在' };

      const result = upsertTable(base, graph, {
        name,
        comment: table.comment || '',
        columns: table.columns,
        position: table.position,
        tableId,
      });
      if (!result.ok) return { ok: false, error: result.error };
      emitChange();
      return { ok: true };
    },

    selectTable(tableId) {
      const graph = graphRef.current;
      const base = diagramRef.current;
      if (!graph || !base) return;

      const table = base.tables.find((t) => t.id === tableId);
      if (!table) return;

      if (table.hidden) {
        const result = setTableHidden(base, graph, tableId, false);
        if (!result.ok) return;
        notifySelection(tableId);
        emitChange();
        return;
      }

      const node = graph.getCellById(tableId);
      if (!node?.isNode()) return;
      graph.select(node);
      graph.centerCell(node);
      notifySelection(tableId);
    },

    setTableHidden(tableId, hidden) {
      const graph = graphRef.current;
      const base = diagramRef.current;
      if (!graph || !base) {
        return { ok: false, error: '画布未就绪' };
      }
      const result = setTableHidden(base, graph, tableId, hidden);
      if (!result.ok) return result;
      if (!hidden) {
        notifySelection(tableId);
      } else if (selectedTableIdRef.current === tableId) {
        notifySelection(null);
      }
      emitChange();
      return { ok: true };
    },

    openTableEdit(tableId) {
      const base = diagramRef.current;
      if (!base?.tables.some((t) => t.id === tableId)) return;
      setDialog({ type: 'table-edit', tableId });
    },

    updateDefaultField(defaultFieldId, patch) {
      const graph = graphRef.current;
      const base = diagramRef.current;
      if (!graph || !base) {
        return { ok: false, error: '画布未就绪' };
      }
      const result = syncDefaultFieldTemplate(base, graph, defaultFieldId, patch);
      if (!result.ok) return result;
      emitChange();
      return { ok: true };
    },

    removeDefaultField(defaultFieldId) {
      const graph = graphRef.current;
      const base = diagramRef.current;
      if (!graph || !base) {
        return { ok: false, error: '画布未就绪' };
      }
      const result = removeDefaultFieldTemplate(base, graph, defaultFieldId);
      if (!result.ok) return result;
      emitChange();
      return { ok: true };
    },
  }));

  useEffect(() => {
    registerErShapes();
    injectTableNodeStyles();
    injectTextAnnotationNodeStyles();

    const container = containerRef.current;
    if (!container) return undefined;

    const preventNativeMenu = (e) => e.preventDefault();
    container.addEventListener('contextmenu', preventNativeMenu);

    let disposed = false;
    const graph = createErGraph(container, { onDiagramChange: emitChange });
    graphRef.current = graph;

    const onSelectionChanged = () => {
      const selected = graph.getSelectedCells().filter((c) => c.isNode());
      const node = selected[0];
      const tableId =
        node && node.shape === TABLE_SHAPE ? /** @type {string} */ (node.id) : null;
      notifySelection(tableId);
    };

    const onBlankContextMenu = ({ e }) => {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        items: [
          { id: 'create-table', label: '新建表' },
          { id: 'create-annotation', label: '添加文字描述' },
        ],
        payload: { clientX: e.clientX, clientY: e.clientY },
      });
    };

    const onAnnotationContextMenuEvent = (event) => {
      const { annotationId, clientX, clientY } = /** @type {CustomEvent} */ (event).detail;
      if (!annotationId) return;
      const node = graph.getCellById(annotationId);
      if (!node?.isNode()) return;
      graph.select(node);
      setContextMenu({
        x: clientX,
        y: clientY,
        items: [
          { id: 'edit-annotation', label: '编辑文字' },
          { id: 'delete-annotation', label: '删除', danger: true },
        ],
        payload: { annotationId },
      });
    };

    const onEdgeCommentEditEvent = (event) => {
      const { edgeId, clientX, clientY } = /** @type {CustomEvent} */ (event).detail;
      if (!edgeId) return;
      openEdgeCommentEdit(edgeId, clientX, clientY);
    };

    const onEdgeContextMenuEvent = (event) => {
      const { edgeId, clientX, clientY } = /** @type {CustomEvent} */ (event).detail;
      if (!edgeId) return;
      const edge = graph.getCellById(edgeId);
      if (!edge?.isEdge()) return;
      graph.select(edge);
      setContextMenu({
        x: clientX,
        y: clientY,
        items: [
          { id: 'edit-edge-comment', label: '编辑连线说明' },
          { id: 'cycle-edge-cardinality', label: '切换关系基数' },
        ],
        payload: { edgeId, clientX, clientY },
      });
    };

    const onAnnotationCommit = (event) => {
      const { annotationId, text } = /** @type {CustomEvent} */ (event).detail;
      if (!annotationId) return;
      const result = commitAnnotation(graph, annotationId, text);
      if (!result.ok) {
        showToast('err', result.error || '保存失败');
        return;
      }
      emitChange();
    };

    const onAnnotationCancel = (event) => {
      const { annotationId } = /** @type {CustomEvent} */ (event).detail;
      if (!annotationId) return;
      cancelAnnotationEdit(graph, annotationId);
      emitChange();
    };

    const onNodeContextMenuEvent = (event) => {
      const detail = /** @type {CustomEvent} */ (event).detail;
      const { tableId, target, columnId, clientX, clientY } = detail;
      if (!tableId) return;

      graph.select(graph.getCellById(tableId));

      if (target === 'header') {
        const node = graph.getCellById(tableId);
        const collapsed = Boolean(node?.getData()?.collapsed);
        setContextMenu({
          x: clientX,
          y: clientY,
          items: [
            { id: 'edit-table', label: '编辑表信息' },
            { id: 'add-field', label: '新增字段' },
            collapsed
              ? { id: 'expand-table', label: '展开字段' }
              : { id: 'collapse-table', label: '折叠字段' },
            { id: 'hide-table', label: '从画布隐藏' },
          ],
          payload: { tableId },
        });
        return;
      }

      if (target === 'field' && columnId) {
        const cols = graph.getCellById(tableId)?.getData()?.columns || [];
        const fieldIndex = cols.findIndex((/** @type {{ id: string }} */ c) => c.id === columnId);
        const column = cols[fieldIndex];
        setContextMenu({
          x: clientX,
          y: clientY,
          items: [
            { id: 'edit-field', label: '编辑字段信息' },
            column?.defaultFieldId
              ? { id: 'unlink-from-default-fields', label: '移出默认字段' }
              : { id: 'add-to-default-fields', label: '加入默认字段' },
            { id: 'set-field-color', label: '设置颜色' },
            ...(column?.color ? [{ id: 'clear-field-color', label: '清除颜色' }] : []),
            {
              id: 'move-field-up',
              label: '上移',
              disabled: fieldIndex <= 0,
            },
            {
              id: 'move-field-down',
              label: '下移',
              disabled: fieldIndex < 0 || fieldIndex >= cols.length - 1,
            },
            { id: 'delete-field', label: '删除字段', danger: true },
          ],
          payload: { tableId, columnId },
        });
      }
    };

    const onReorderColumn = (event) => {
      const base = diagramRef.current;
      if (!base) return;
      const { tableId, columnId, toIndex } = /** @type {CustomEvent} */ (event).detail;
      const result = reorderColumn(base, graph, tableId, columnId, toIndex);
      if (!result.ok) {
        showToast('err', result.error || '排序失败');
        return;
      }
      emitChange();
    };

    const onToggleCollapse = (event) => {
      const { tableId } = /** @type {CustomEvent} */ (event).detail;
      const node = graph.getCellById(tableId);
      if (!node?.isNode()) return;
      const data = node.getData() || {};
      setTableCollapsed(graph, node, !data.collapsed);
    };

    graph.on('selection:changed', onSelectionChanged);
    graph.on('blank:click', () => notifySelection(null));
    graph.on('blank:contextmenu', onBlankContextMenu);
    container.addEventListener('er-node-contextmenu', onNodeContextMenuEvent);
    container.addEventListener('er-annotation-contextmenu', onAnnotationContextMenuEvent);
    container.addEventListener('er-annotation-commit', onAnnotationCommit);
    container.addEventListener('er-annotation-cancel', onAnnotationCancel);
    container.addEventListener('er-edge-comment-edit', onEdgeCommentEditEvent);
    container.addEventListener('er-edge-contextmenu', onEdgeContextMenuEvent);
    container.addEventListener('er-reorder-column', onReorderColumn);
    container.addEventListener('er-toggle-collapse', onToggleCollapse);

    const applyDiagram = (diagram) => {
      if (disposed) return;
      const errors = validateDiagram(diagram);
      if (errors.length > 0) {
        console.error('[ERCanvas] invalid diagram:', errors);
        return;
      }
      diagramRef.current = diagram;
      renderDiagram(graph, diagram);
      if (diagram.tables.length > 0) {
        graph.centerContent();
      }
      onDiagramChangeRef.current?.(diagram);
    };

    if (diagramUrl) {
      (async () => {
        try {
          const res = await fetch(diagramUrl);
          if (!res.ok) throw new Error(`Failed to load ${diagramUrl}`);
          applyDiagram(await res.json());
        } catch (err) {
          console.error('[ERCanvas] load failed:', err);
        }
      })();
    } else {
      applyDiagram(createEmptyDiagram());
    }

    return () => {
      disposed = true;
      container.removeEventListener('contextmenu', preventNativeMenu);
      container.removeEventListener('er-node-contextmenu', onNodeContextMenuEvent);
      container.removeEventListener('er-annotation-contextmenu', onAnnotationContextMenuEvent);
      container.removeEventListener('er-annotation-commit', onAnnotationCommit);
      container.removeEventListener('er-annotation-cancel', onAnnotationCancel);
      container.removeEventListener('er-edge-comment-edit', onEdgeCommentEditEvent);
      container.removeEventListener('er-edge-contextmenu', onEdgeContextMenuEvent);
      container.removeEventListener('er-reorder-column', onReorderColumn);
      container.removeEventListener('er-toggle-collapse', onToggleCollapse);
      graph.off('selection:changed', onSelectionChanged);
      graph.off('blank:contextmenu', onBlankContextMenu);
      graph.dispose();
      graphRef.current = null;
    };
  }, [diagramUrl, emitChange, notifySelection, openEdgeCommentEdit]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    applyFieldColorFilter(graph, fieldColorFilter);
  }, [fieldColorFilter]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    applyDefaultFieldsVisibility(graph, showDefaultFields);
  }, [showDefaultFields]);

  const base = diagramRef.current;
  const editTable =
    dialog?.type === 'table-edit' && dialog.tableId
      ? base?.tables.find((t) => t.id === dialog.tableId)
      : null;
  const editColumn =
    dialog?.type === 'field-edit' && dialog.tableId && dialog.columnId
      ? base?.tables
          .find((t) => t.id === dialog.tableId)
          ?.columns.find((c) => c.id === dialog.columnId)
      : null;

  return (
    <>
      <div ref={containerRef} className="er-canvas" />
      {contextMenu ? (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onSelect={handleContextMenuSelect}
          onClose={() => setContextMenu(null)}
        />
      ) : null}
      {dialog?.type === 'table-create' ? (
        <TableFormDialog
          mode="create"
          initialName={base ? defaultNewTableName(base) : 'Table_1'}
          initialComment=""
          initialFields={[{ name: 'id', dataType: 'bigint' }]}
          onSubmit={runTableFormSubmit}
          onClose={() => {
            setDialog(null);
            pendingPositionRef.current = null;
          }}
        />
      ) : null}
      {dialog?.type === 'table-edit' && editTable ? (
        <TableFormDialog
          mode="edit"
          initialName={editTable.name}
          initialComment={editTable.comment || ''}
          initialFields={editTable.columns.map((c) => ({
            id: c.id,
            name: c.name,
            dataType: c.dataType,
            comment: c.comment || '',
          }))}
          onSubmit={runTableFormSubmit}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog?.type === 'field-create' ? (
        <FieldFormDialog
          mode="create"
          initialName=""
          initialDataType="varchar(255)"
          onSubmit={runFieldFormSubmit}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog?.type === 'field-edit' && editColumn ? (
        <FieldFormDialog
          mode="edit"
          initialName={editColumn.name}
          initialDataType={editColumn.dataType}
          initialNullable={editColumn.nullable ?? true}
          initialPrimaryKey={editColumn.primaryKey ?? false}
          initialComment={editColumn.comment || ''}
          initialUnique={editColumn.unique ?? false}
          initialColor={editColumn.color}
          onSubmit={runFieldFormSubmit}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {fieldColorPicker ? (
        <FieldColorPopover
          x={fieldColorPicker.x}
          y={fieldColorPicker.y}
          value={fieldColorPicker.value}
          onChange={(color) => {
            const graph = graphRef.current;
            const base = diagramRef.current;
            if (!graph || !base) return;
            const result = setColumnColor(
              base,
              graph,
              fieldColorPicker.tableId,
              fieldColorPicker.columnId,
              color,
            );
            if (!result.ok) {
              showToast('err', result.error || '设置失败');
              return;
            }
            emitChange();
            showToast('ok', color ? '已设置字段颜色' : '已清除字段颜色');
          }}
          onClose={() => setFieldColorPicker(null)}
        />
      ) : null}
      {edgeCommentEdit ? (
        <EdgeCommentEditor
          x={edgeCommentEdit.x}
          y={edgeCommentEdit.y}
          draft={edgeCommentEdit.draft}
          onDraftChange={(draft) =>
            setEdgeCommentEdit((prev) => (prev ? { ...prev, draft } : null))
          }
          onCommit={commitEdgeCommentEdit}
          onCancel={cancelEdgeCommentEdit}
        />
      ) : null}
      {toast ? (
        <div className={`er-canvas-toast ${toast.type}`} role="status">
          {toast.text}
        </div>
      ) : null}
    </>
  );
});

export default ERCanvas;

/** @typedef {ERCanvasHandle} ERCanvasHandleExport */
