import insertCss from 'insert-css';

let injected = false;

export function injectTextAnnotationNodeStyles() {
  if (injected) return;
  injected = true;

  insertCss(`
  .er-text-annotation {
    display: flex;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 8px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px dashed #d4d4d8;
    border-radius: 6px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    cursor: move;
    user-select: none;
  }

  .er-text-annotation--editing {
    cursor: text;
    user-select: auto;
    border-style: solid;
    border-color: #71717a;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .er-text-annotation:hover {
    border-color: #a1a1aa;
    background: #ffffff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }

  .x6-node-selected .er-text-annotation {
    border-color: #71717a;
    border-style: solid;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .er-text-annotation-content {
    width: 100%;
    max-width: 328px;
    font-size: 13px;
    line-height: 1.5;
    color: #52525b;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .er-text-annotation-content--placeholder {
    color: #a1a1aa;
    font-style: italic;
  }

  .er-text-annotation-input {
    display: block;
    width: 100%;
    min-height: 24px;
    max-width: 328px;
    margin: 0;
    padding: 0;
    border: none;
    outline: none;
    resize: none;
    overflow: hidden;
    background: transparent;
    font-family: inherit;
    font-size: 13px;
    line-height: 1.5;
    color: #52525b;
    white-space: pre-wrap;
    word-break: break-word;
  }
  `);
}
