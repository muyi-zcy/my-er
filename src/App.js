import { useRef } from 'react';
import './App.css';
import ERCanvas from './components/Canvas/ERCanvas';
import Logo from './components/Logo/Logo';
import Toolbar from './components/Toolbar/Toolbar';

function App() {
  const canvasRef = useRef(/** @type {import('./components/Canvas/ERCanvas').ERCanvasHandleExport | null} */ (null));

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
        <ERCanvas ref={canvasRef} />
      </main>
    </div>
  );
}

export default App;
