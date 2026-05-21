import { useState } from 'react';
import { DATA_TYPES } from '../../constants/dataTypes';
import FieldColorPicker from '../FieldColor/FieldColorPicker';
import './dialog.css';

/**
 * @param {{
 *   mode: 'create' | 'edit',
 *   initialName?: string,
 *   initialDataType?: string,
 *   initialNullable?: boolean,
 *   initialPrimaryKey?: boolean,
 *   initialComment?: string,
 *   initialUnique?: boolean,
 *   initialColor?: string,
 *   onSubmit: (payload: {
 *     name: string,
 *     dataType: string,
 *     comment: string,
 *     nullable: boolean,
 *     primaryKey: boolean,
 *     unique: boolean,
 *     color?: string | null,
 *   }) => void,
 *   onClose: () => void,
 * }} props
 */
export default function FieldFormDialog({
  mode,
  initialName = '',
  initialDataType = 'varchar(255)',
  initialNullable = true,
  initialPrimaryKey = false,
  initialComment = '',
  initialUnique = false,
  initialColor,
  onSubmit,
  onClose,
}) {
  const [name, setName] = useState(initialName);
  const [comment, setComment] = useState(initialComment);
  const [dataType, setDataType] = useState(initialDataType);
  const [nullable, setNullable] = useState(initialNullable);
  const [primaryKey, setPrimaryKey] = useState(initialPrimaryKey);
  const [unique, setUnique] = useState(initialUnique);
  const [color, setColor] = useState(initialColor);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('请填写字段名');
      return;
    }
    onSubmit({
      name: name.trim(),
      dataType,
      comment: comment.trim(),
      nullable: primaryKey ? false : nullable,
      primaryKey,
      unique,
      color: color || null,
    });
  };

  return (
    <div className="er-dialog-backdrop" onClick={onClose}>
      <div
        className="er-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="field-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="er-dialog-header">
          <h2 id="field-dialog-title" className="er-dialog-title">
            {mode === 'create' ? '新增字段' : '编辑字段'}
          </h2>
          <button type="button" className="er-dialog-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="er-dialog-body">
            {error ? <p className="er-form-error">{error}</p> : null}

            <div className="er-form-row">
              <label htmlFor="field-name">字段名</label>
              <input
                id="field-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如 user_id"
                autoFocus
              />
            </div>

            <div className="er-form-row">
              <label htmlFor="field-type">类型</label>
              <select
                id="field-type"
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
              >
                {DATA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="er-form-row">
              <span className="er-form-label-text">标记颜色</span>
              <FieldColorPicker value={color} onChange={setColor} />
            </div>

            <div className="er-form-row">
              <label htmlFor="field-comment">描述</label>
              <textarea
                id="field-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="字段注释（可选）"
              />
            </div>

            {mode === 'edit' ? (
              <div className="er-checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={primaryKey}
                    onChange={(e) => {
                      setPrimaryKey(e.target.checked);
                      if (e.target.checked) setNullable(false);
                    }}
                  />
                  主键
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={unique}
                    onChange={(e) => setUnique(e.target.checked)}
                  />
                  唯一
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={nullable}
                    disabled={primaryKey}
                    onChange={(e) => setNullable(e.target.checked)}
                  />
                  可空
                </label>
              </div>
            ) : null}
          </div>

          <div className="er-dialog-footer">
            <button type="button" className="er-btn" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="er-btn primary">
              {mode === 'create' ? '添加' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
