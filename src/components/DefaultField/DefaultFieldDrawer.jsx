import { useState } from 'react';
import { DATA_TYPES } from '../../constants/dataTypes';
import './DefaultFieldDrawer.css';

/**
 * @param {{
 *   defaultFields: import('../../model/defaultFields').DefaultField[],
 *   showDefaultFields: boolean,
 *   onShowChange: (show: boolean) => void,
 *   onUpdate: (
 *     id: string,
 *     patch: Partial<import('../../model/defaultFields').DefaultField>,
 *   ) => { ok?: boolean, error?: string } | void,
 *   onRemove: (id: string) => { ok?: boolean, error?: string } | void,
 * }} props
 */
export default function DefaultFieldDrawer({
  defaultFields,
  showDefaultFields,
  onShowChange,
  onUpdate,
  onRemove,
}) {
  const [editingId, setEditingId] = useState(/** @type {string | null} */ (null));

  return (
    <aside className="default-field-drawer" aria-label="默认字段">
      <header className="default-field-drawer-header">
        <h2 className="default-field-drawer-title">默认字段</h2>
      </header>

      <div className="default-field-drawer-body">
        <label className="default-field-show-toggle">
          <input
            type="checkbox"
            checked={showDefaultFields}
            onChange={(e) => onShowChange(e.target.checked)}
          />
          <span>在画布显示默认字段</span>
        </label>
        <p className="default-field-drawer-hint">
          在字段上右键可加入默认字段，各表中同名字段会一并标记。关闭显示后，所有已关联的默认字段在表中隐藏；在此修改将同步到全部关联字段。
        </p>

        {defaultFields.length === 0 ? (
          <p className="default-field-drawer-empty">暂无默认字段</p>
        ) : (
          <ul className="default-field-list">
            {defaultFields.map((field) => (
              <li key={field.id} className="default-field-item">
                {editingId === field.id ? (
                  <DefaultFieldEditForm
                    field={field}
                    onSave={(patch) => {
                      const result = onUpdate(field.id, patch);
                      if (result && result.ok === false) return result;
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      className="default-field-item-main"
                      onClick={() => setEditingId(field.id)}
                    >
                      <span className="default-field-item-name">{field.name}</span>
                      <span className="default-field-item-type">{field.dataType}</span>
                    </button>
                    <button
                      type="button"
                      className="default-field-item-remove"
                      title="从默认字段列表移除"
                      aria-label={`移除 ${field.name}`}
                      onClick={() => onRemove(field.id)}
                    >
                      ×
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

/**
 * @param {{
 *   field: import('../../model/defaultFields').DefaultField,
 *   onSave: (patch: Partial<import('../../model/defaultFields').DefaultField>) => { ok?: boolean, error?: string } | void,
 *   onCancel: () => void,
 * }} props
 */
function DefaultFieldEditForm({ field, onSave, onCancel }) {
  const [error, setError] = useState('');
  const [name, setName] = useState(field.name);
  const [dataType, setDataType] = useState(field.dataType);
  const [comment, setComment] = useState(field.comment || '');
  const [nullable, setNullable] = useState(field.nullable ?? true);
  const [primaryKey, setPrimaryKey] = useState(field.primaryKey ?? false);
  const [unique, setUnique] = useState(field.unique ?? false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('请填写字段名');
      return;
    }
    const result = onSave({
      name: name.trim(),
      dataType,
      comment: comment.trim(),
      nullable: primaryKey ? false : nullable,
      primaryKey,
      unique,
    });
    if (result && result.ok === false) {
      setError(result.error || '保存失败');
    }
  };

  return (
    <form className="default-field-edit-form" onSubmit={handleSubmit}>
      {error ? <p className="default-field-edit-error">{error}</p> : null}
      <label className="default-field-edit-label">
        名称
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="default-field-edit-label">
        类型
        <select value={dataType} onChange={(e) => setDataType(e.target.value)}>
          {DATA_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="default-field-edit-label">
        说明
        <input value={comment} onChange={(e) => setComment(e.target.value)} />
      </label>
      <div className="default-field-edit-flags">
        <label>
          <input
            type="checkbox"
            checked={primaryKey}
            onChange={(e) => setPrimaryKey(e.target.checked)}
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
      <div className="default-field-edit-actions">
        <button type="submit" className="default-field-edit-save">
          保存
        </button>
        <button type="button" className="default-field-edit-cancel" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}
