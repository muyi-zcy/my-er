import {
  fieldPortId,
  parseColumnId,
  getConnectedColumnIds,
} from './portResolver';

test('parseColumnId supports left/right and legacy in/out', () => {
  expect(parseColumnId('field-user_id-left')).toBe('user_id');
  expect(parseColumnId('field-user_id-right')).toBe('user_id');
  expect(parseColumnId('field-user_id-in')).toBe('user_id');
});

test('fieldPortId', () => {
  expect(fieldPortId('id', 'left')).toBe('field-id-left');
});

test('getConnectedColumnIds collects field ports on both ends', () => {
  const edges = [
    {
      getSource: () => ({ cell: 'orders', port: 'field-user_id-right' }),
      getTarget: () => ({ cell: 'users', port: 'field-id-left' }),
    },
    {
      getSource: () => ({ cell: 'orders', port: 'table-right' }),
      getTarget: () => ({ cell: 'products', port: 'table-left' }),
    },
  ];

  const graph = {
    getCellById: (id) => (id === 'orders' ? { isNode: () => true } : null),
    getConnectedEdges: () => edges,
  };

  const ids = getConnectedColumnIds(/** @type {*} */ (graph), 'orders');
  expect([...ids]).toEqual(['user_id']);
});
