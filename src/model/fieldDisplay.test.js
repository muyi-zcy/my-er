import { getDisplayColumns } from './fieldDisplay';

const columns = [
  { id: 'a', name: 'a', dataType: 'int', color: '#111111' },
  { id: 'b', name: 'b', dataType: 'int', color: '#222222' },
  { id: 'c', name: 'c', dataType: 'int' },
];

describe('getDisplayColumns', () => {
  it('returns all columns when not collapsed', () => {
    expect(getDisplayColumns(columns).map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('shows connected fields when collapsed', () => {
    const result = getDisplayColumns(columns, {
      collapsed: true,
      connectedColumnIds: ['b', 'c'],
    });
    expect(result.map((c) => c.id)).toEqual(['b', 'c']);
  });

  it('hides default field columns when showDefaultFields is false', () => {
    const withDefault = [
      ...columns,
      { id: 'd', name: 'created_at', dataType: 'datetime', defaultFieldId: 'df1' },
    ];
    expect(
      getDisplayColumns(withDefault, { showDefaultFields: false }).map((c) => c.id),
    ).toEqual(['a', 'b', 'c']);
  });
});
