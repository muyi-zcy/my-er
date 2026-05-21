import { useRef, useState } from 'react';
import { readSqlFiles } from '../../io/sqlFile';
import './dialog.css';
import './sqlImportDialog.css';

/**
 * @param {{
 *   onImport: (sql: string) => void,
 *   onClose: () => void,
 * }} props
 */
export default function SqlImportDialog({ onImport, onClose }) {
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const [sql, setSql] = useState('');
  const [fileNames, setFileNames] = useState(/** @type {string[]} */ ([]));
  const [error, setError] = useState('');

  const handlePickFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChange = async (event) => {
    const input = /** @type {HTMLInputElement} */ (event.target);
    // 须在清空 input 前拷贝 File，否则异步读取时 FileList 会被浏览器置空
    const picked = [...(input.files ?? [])];
    if (picked.length === 0) return;

    const invalid = picked.find((f) => !f.name.toLowerCase().endsWith('.sql'));
    if (invalid) {
      setError('仅支持 .sql 文件');
      input.value = '';
      return;
    }

    try {
      const merged = await readSqlFiles(picked);
      setSql((prev) => (prev.trim() ? `${prev.trim()}\n\n${merged}` : merged));
      setFileNames((prev) => [...prev, ...picked.map((f) => f.name)]);
      setError('');
    } catch {
      setError('无法读取 SQL 文件');
    } finally {
      input.value = '';
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = sql.trim();
    if (!trimmed) {
      setError('请粘贴 SQL 或选择 .sql 文件');
      return;
    }
    setError('');
    onImport(trimmed);
  };

  return (
    <div className="er-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="er-dialog er-dialog-sql"
        role="dialog"
        aria-labelledby="sql-import-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="er-dialog-header">
          <h2 id="sql-import-title" className="er-dialog-title">
            导入 SQL
          </h2>
          <button type="button" className="er-dialog-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="er-dialog-body">
            <p className="sql-import-hint">
              支持粘贴 DDL，或一次选择多个 <code>.sql</code> 文件批量合并导入（解析 CREATE TABLE 与外键）。
            </p>

            <div className="er-form-row">
              <label htmlFor="sql-import-content">SQL 内容</label>
              <textarea
                id="sql-import-content"
                className="sql-import-textarea"
                rows={18}
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                placeholder={'CREATE TABLE `users` (\n  `id` bigint NOT NULL,\n  ...\n);'}
                spellCheck={false}
              />
            </div>

            <div className="sql-import-file-row">
              <button type="button" className="er-btn" onClick={handlePickFiles}>
                选择 SQL 文件…
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".sql,.SQL,application/sql,text/plain"
                multiple
                className="sql-import-file-input"
                onChange={handleFilesChange}
              />
              {fileNames.length > 0 ? (
                <span className="sql-import-file-count">已选 {fileNames.length} 个文件</span>
              ) : null}
            </div>

            {fileNames.length > 0 ? (
              <ul className="sql-import-file-list">
                {fileNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            ) : null}

            {error ? <p className="er-form-error">{error}</p> : null}
          </div>

          <div className="er-dialog-footer">
            <button type="button" className="er-btn" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="er-btn primary">
              导入到画布
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
