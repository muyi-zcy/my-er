import {
  pickSideFromPositions,
  parseColumnId,
  fieldPortId,
  tablePortId,
} from './portResolver';

test('pickSideFromPositions chooses side facing the other node', () => {
  expect(pickSideFromPositions(0, 400)).toBe('right');
  expect(pickSideFromPositions(400, 0)).toBe('left');
});

test('parseColumnId supports left/right and legacy in/out', () => {
  expect(parseColumnId('field-user_id-left')).toBe('user_id');
  expect(parseColumnId('field-user_id-right')).toBe('user_id');
  expect(parseColumnId('field-user_id-in')).toBe('user_id');
});

test('port id helpers', () => {
  expect(fieldPortId('id', 'left')).toBe('field-id-left');
  expect(tablePortId('right')).toBe('table-right');
});
