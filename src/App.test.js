import { render, screen } from '@testing-library/react';

jest.mock('./components/Canvas/ERCanvas', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef(function MockERCanvas(_props, ref) {
      React.      useImperativeHandle(ref, () => ({
        getDiagram: () => null,
        load: () => ({ ok: true }),
        addTable: () => ({ ok: true, tableId: 't1' }),
        openCreateTableDialog: () => {},
        addField: () => ({ ok: false, error: 'mock' }),
        setTableName: () => ({ ok: true }),
        getSelectedTableId: () => null,
        selectTable: () => {},
        setTableHidden: () => ({ ok: true }),
        openTableEdit: () => {},
      }));
      return React.createElement('div', { 'data-testid': 'er-canvas-mock' });
    }),
  };
});

import App from './App';

test('renders ER designer title', () => {
  render(<App />);
  expect(screen.getByText(/MY-ER/i)).toBeInTheDocument();
});

test('renders toolbar actions', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: '导入 JSON' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '导入 SQL' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '导出 JSON' })).toBeInTheDocument();
});

test('renders table list panel', () => {
  render(<App />);
  expect(screen.getByRole('complementary', { name: '表列表' })).toBeInTheDocument();
});
