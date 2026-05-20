import { validateDiagram, isTableNameAvailable } from './validateDiagram';

test('rejects duplicate table names', () => {
  const errors = validateDiagram({
    schemaVersion: '1.0.0',
    tables: [
      { id: 'a', name: 'Users', position: { x: 0, y: 0 }, columns: [] },
      { id: 'b', name: 'users', position: { x: 0, y: 0 }, columns: [] },
    ],
    relationships: [],
  });
  expect(errors.some((e) => e.includes('表编码重复'))).toBe(true);
});

test('isTableNameAvailable is case-insensitive', () => {
  const diagram = {
    schemaVersion: '1.0.0',
    tables: [{ id: 't1', name: 'Orders', position: { x: 0, y: 0 }, columns: [] }],
    relationships: [],
  };
  expect(isTableNameAvailable(diagram, 'orders')).toBe(false);
  expect(isTableNameAvailable(diagram, 'orders', 't1')).toBe(true);
});
