import { useState } from 'react';
import { DATA_TYPES } from '../../constants/dataTypes';
import './dialog.css';

/** @typedef {{ id?: string, name: string, dataType: string }} FieldRow */

/**
 * @param {{
 *   mode: 'create' | 'edit',
 *   initialName?: string,
 *   initialComment?: string,
 *   initialFields?: FieldRow[],
 *   onSubmit: (payload: { name: string, comment: string, fields: FieldRow[] }) => void,
 *   onClose: () => void,
 * }} props
 */
export default function TableFormDialog({
  mode,
  initialName = '',
  initialComment = '',
  initialFields = [{ name: 'id', dataType: 'bigint' }],
  onSubmit,
  onClose,
}) {
  const [name, setName] = useState(initialName);
  const [comment, setComment] = useState(initialComment);
  const [fields, setFields] = useState(
    initialFields.length > 0 ? initialFields : [{ name: '', dataType: 'varchar(255)' }],
  );
  const [error, setError] = useState('');

  const addFieldRow = () => {
    setFields((rows) => [...rows, { name: '', dataType: 'varchar(255)' }]);
  };

  const removeFieldRow = (index) => {
    setFields((rows) => rows.filter((_, i) => i !== index));
  };

  const updateFieldRow = (index, key, value) => {
    setFields((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('请填写表编码');
      return;
    }

    const validFields = fields.filter((f) => f.name.trim());
    const names = validFields.map((f) => f.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      setError('字段名不能重复');
      return;
    }

    onSubmit({
      name: trimmedName,
      comment: comment.trim(),
      fields: validFields.map((f) => ({
        id: f.id,
        name: f.name.trim(),
        dataType: f.dataType,
      })),
    });
  };

  return (
    <div className="er-dialog-backdrop" onClick={onClose}>
      <div
        className="er-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="table-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="er-dialog-header">
          <h2 id="table-dialog-title" className="er-dialog-title">
            {mode === 'create' ? '新建表' : '编辑表信息'}
          </h2>
          <button type="button" className="er-dialog-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="er-dialog-body">
            {error ? <p className="er-form-error">{error}</p> : null}

            <div className="er-form-row">
              <label htmlFor="table-name">表编码</label>
              <input
                id="table-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如 orders"
                autoFocus
              />
            </div>

            <div className="er-form-row">
              <label htmlFor="table-comment">描述</label>
              <textarea
                id="table-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="表注释（可选）"
              />
            </div>

            <div className="er-field-list">
              <div className="er-field-list-header">
                <span>字段</span>
                <button type="button" className="er-btn text" onClick={addFieldRow}>
                  + 添加字段
                </button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id || `row-${index}`} className="er-field-row">
                  <input
                    value={field.name}
                    onChange={(e) => updateFieldRow(index, 'name', e.target.value)}
                    placeholder="字段名"
                  />
                  <select
                    value={field.dataType}
                    onChange={(e) => updateFieldRow(index, 'dataType', e.target.value)}
                  >
                    {DATA_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="er-btn icon"
                    onClick={() => removeFieldRow(index)}
                    disabled={fields.length <= 1}
                    title="删除行"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="er-dialog-footer">
            <button type="button" className="er-btn" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="er-btn primary">
              {mode === 'create' ? '创建' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
