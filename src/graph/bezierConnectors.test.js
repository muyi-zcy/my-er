import { connectorForKind, CONNECTOR_CUBIC, CONNECTOR_QUADRATIC } from './bezierConnectors';

test('connectorForKind maps relationship kind to bezier type', () => {
  expect(connectorForKind('field-field').name).toBe(CONNECTOR_CUBIC);
  expect(connectorForKind('field-table').name).toBe(CONNECTOR_CUBIC);
  expect(connectorForKind('table-table').name).toBe(CONNECTOR_QUADRATIC);
});
