import { useRef, useState, useCallback, useEffect } from 'react';
import { collectUsedFieldColors } from './constants/fieldColors';
import { getDefaultFields } from './model/defaultFields';
import './App.css';
import ERCanvas from './components/Canvas/ERCanvas';
import Logo from './components/Logo/Logo';
import Toolbar from './components/Toolbar/Toolbar';
import RightSidebar from './components/RightSidebar/RightSidebar';

function App() {
  const canvasRef = useRef(/** @type {import('./components/Canvas/ERCanvas').ERCanvasHandleExport | null} */ (null));
  const [diagram, setDiagram] = useState(/** @type {import('./model/erDiagram').ErDiagram | null} */ (null));
  const [selectedTableId, setSelectedTableId] = useState(/** @type {string | null} */ (null));
  /** @type {['tables' | 'colors' | 'defaults' | null, React.Dispatch<React.SetStateAction<'tables' | 'colors' | 'defaults' | null>>]} */
  const [activeDrawer, setActiveDrawer] = useState(
    /** @type {'tables' | 'colors' | 'defaults' | null} */ (null),
  );
  const [fieldColorFilter, setFieldColorFilter] = useState(/** @type {string | null} */ (null));
  const [showDefaultFields, setShowDefaultFields] = useState(true);

  useEffect(() => {
    if (!fieldColorFilter) return;
    const used = collectUsedFieldColors(diagram);
    if (!used.some((u) => u.color === fieldColorFilter)) {
      setFieldColorFilter(null);
    }
  }, [diagram, fieldColorFilter]);

  const handleSelectTable = useCallback((tableId) => {
    canvasRef.current?.selectTable(tableId);
  }, []);

  const handleToggleHidden = useCallback((tableId, hidden) => {
    canvasRef.current?.setTableHidden(tableId, hidden);
  }, []);

  const handleEditTable = useCallback((tableId) => {
    canvasRef.current?.openTableEdit(tableId);
  }, []);

  const handleUpdateDefaultField = useCallback((id, patch) => {
    return canvasRef.current?.updateDefaultField(id, patch);
  }, []);

  const handleRemoveDefaultField = useCallback((id) => {
    return canvasRef.current?.removeDefaultField(id);
  }, []);

  const defaultFields = getDefaultFields(diagram);

  return (
    <div className="app">
      <header className="app-toolbar">
        <div className="app-brand">
          <Logo className="app-logo" />
          <h1 className="app-title">MY-ER</h1>
        </div>
        <Toolbar canvasRef={canvasRef} />
      </header>
      <main className="app-main">
        <div className="app-canvas-area">
          <ERCanvas
            ref={canvasRef}
            fieldColorFilter={fieldColorFilter}
            showDefaultFields={showDefaultFields}
            onDiagramChange={setDiagram}
            onSelectionChange={setSelectedTableId}
          />
        </div>
        <RightSidebar
          activeDrawer={activeDrawer}
          onActiveDrawerChange={setActiveDrawer}
          tables={{
            tables: diagram?.tables ?? [],
            selectedTableId,
            onSelectTable: handleSelectTable,
            onToggleHidden: handleToggleHidden,
            onEditTable: handleEditTable,
          }}
          colors={{
            diagram,
            activeColor: fieldColorFilter,
            onFilterChange: setFieldColorFilter,
          }}
          defaults={{
            defaultFields,
            showDefaultFields,
            onShowChange: setShowDefaultFields,
            onUpdate: handleUpdateDefaultField,
            onRemove: handleRemoveDefaultField,
          }}
        />
      </main>
    </div>
  );
}

export default App;
