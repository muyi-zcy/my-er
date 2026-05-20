import { reorderColumnList } from '../model/columnOrder';

test('reorderColumnList moves item down', () => {
  const cols = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const result = reorderColumnList(cols, 0, 2);
  expect(result.map((c) => c.id)).toEqual(['b', 'c', 'a']);
});

test('reorderColumnList moves item up', () => {
  const cols = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const result = reorderColumnList(cols, 2, 0);
  expect(result.map((c) => c.id)).toEqual(['c', 'a', 'b']);
});
