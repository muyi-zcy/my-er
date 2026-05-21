import { useRef, useState, useCallback } from 'react';
import { downloadJson, readJsonFile } from '../../io/jsonFile';
import { sqlToDiagram } from '../../io/sqlAdapter';
import { validateDiagram } from '../../model/validateDiagram';
import { normalizeDiagram } from '../../model/diagramOps';
import SqlImportDialog from '../Dialog/SqlImportDialog';
import './Toolbar.css';

/**
 * @param {{
 *   canvasRef: React.RefObject<import('../Canvas/ERCanvas').ERCanvasHandleExport | null>,
 * }} props
 */
export default function Toolbar({ canvasRef }) {
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const [message, setMessage] = useState(/** @type {{ type: 'ok' | 'err', text: string } | null} */ (null));
  const [sqlDialogOpen, setSqlDialogOpen] = useState(false);

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 4000);
  }, []);

  const handleExport = () => {
    const diagram = canvasRef.current?.getDiagram();
    if (!diagram) {
      showMessage('err', '画布未就绪');
      return;
    }
    const errors = validateDiagram(diagram);
    if (errors.length > 0) {
      showMessage('err', errors[0]);
      return;
    }
    const name = diagram.metadata?.name || 'er-diagram';
    const safeName = name.replace(/[^\w.-]+/g, '_');
    downloadJson(diagram, `${safeName}.json`);
    showMessage('ok', '已导出 JSON');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      showMessage('err', '仅支持 .json 文件');
      return;
    }

    try {
      const raw = await readJsonFile(file);
      const diagram = normalizeDiagram(raw);
      const errors = validateDiagram(diagram);
      if (errors.length > 0) {
        showMessage('err', errors.join('；'));
        return;
      }

      const result = canvasRef.current?.load(diagram);
      if (!result?.ok) {
        showMessage('err', result?.errors?.join('；') || '导入失败');
        return;
      }
      showMessage('ok', '已导入 ER 图');
    } catch {
      showMessage('err', '无法读取或解析 JSON 文件');
    }
  };

  const handleSqlImport = (sql) => {
    const parsed = sqlToDiagram(sql);
    if (!parsed.ok) {
      showMessage('err', parsed.error);
      return;
    }

    const diagram = normalizeDiagram(parsed.diagram);
    const errors = validateDiagram(diagram);
    if (errors.length > 0) {
      showMessage('err', errors.join('；'));
      return;
    }

    const result = canvasRef.current?.load(diagram);
    if (!result?.ok) {
      showMessage('err', result?.errors?.join('；') || '导入失败');
      return;
    }

    setSqlDialogOpen(false);
    const tableCount = diagram.tables.length;
    const relCount = diagram.relationships.length;
    showMessage('ok', `已导入 ${tableCount} 张表${relCount > 0 ? `、${relCount} 条关系` : ''}`);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-spacer" />

      <div className="toolbar-group">
        <button type="button" className="toolbar-btn" onClick={handleImportClick}>
          导入 JSON
        </button>
        <button type="button" className="toolbar-btn" onClick={() => setSqlDialogOpen(true)}>
          导入 SQL
        </button>
        <button type="button" className="toolbar-btn" onClick={handleExport}>
          导出 JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="toolbar-file-input"
          onChange={handleImportFile}
        />
      </div>

      {message ? (
        <div className={`toolbar-message ${message.type}`} role="status">
          {message.text}
        </div>
      ) : null}

      {sqlDialogOpen ? (
        <SqlImportDialog onImport={handleSqlImport} onClose={() => setSqlDialogOpen(false)} />
      ) : null}
    </div>
  );
}
