import { linkMatchingColumnsToDefaultField } from './defaultFields';

describe('linkMatchingColumnsToDefaultField', () => {
  it('marks same-named columns across all tables', () => {
    const diagram = {
      schemaVersion: '1.0.0',
      tables: [
        {
          id: 't1',
          name: 'A',
          position: { x: 0, y: 0 },
          columns: [
            { id: 'c1', name: 'created_at', dataType: 'datetime' },
            { id: 'c2', name: 'name', dataType: 'varchar(255)' },
          ],
        },
        {
          id: 't2',
          name: 'B',
          position: { x: 0, y: 0 },
          columns: [{ id: 'c3', name: 'Created_At', dataType: 'timestamp' }],
        },
      ],
      relationships: [],
    };

    const affected = linkMatchingColumnsToDefaultField(diagram, 'df1', 'created_at');

    expect(affected).toEqual(new Set(['t1', 't2']));
    expect(diagram.tables[0].columns[0].defaultFieldId).toBe('df1');
    expect(diagram.tables[0].columns[1].defaultFieldId).toBeUndefined();
    expect(diagram.tables[1].columns[0].defaultFieldId).toBe('df1');
  });
});
