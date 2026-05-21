import {
  normalizeFieldColor,
  collectUsedFieldColors,
  resolveFieldColorDisplay,
  MORANDI_COLORS,
} from './fieldColors';

describe('normalizeFieldColor', () => {
  it('accepts 6-digit hex', () => {
    expect(normalizeFieldColor('#9CAF88')).toBe('#9CAF88');
  });

  it('expands 3-digit hex', () => {
    expect(normalizeFieldColor('#abc')).toBe('#aabbcc');
  });

  it('rejects invalid values', () => {
    expect(normalizeFieldColor('red')).toBeUndefined();
    expect(normalizeFieldColor('')).toBeUndefined();
  });
});

describe('resolveFieldColorDisplay', () => {
  it('shows all colors when no filter', () => {
    expect(resolveFieldColorDisplay('#9CAF88', null)).toBe('#9CAF88');
  });

  it('hides non-matching colors when filter is active', () => {
    expect(resolveFieldColorDisplay('#9CAF88', '#C4A5A5')).toBeUndefined();
    expect(resolveFieldColorDisplay('#C4A5A5', '#C4A5A5')).toBe('#C4A5A5');
  });
});

describe('collectUsedFieldColors', () => {
  it('counts colors across tables', () => {
    const diagram = {
      tables: [
        {
          id: 't1',
          name: 'a',
          position: { x: 0, y: 0 },
          columns: [
            { id: 'c1', name: 'x', dataType: 'int', color: MORANDI_COLORS[0].value },
            { id: 'c2', name: 'y', dataType: 'int', color: MORANDI_COLORS[0].value },
          ],
        },
      ],
      relationships: [],
    };
    const used = collectUsedFieldColors(diagram);
    expect(used).toHaveLength(1);
    expect(used[0].count).toBe(2);
    expect(used[0].label).toBe(MORANDI_COLORS[0].label);
  });
});
