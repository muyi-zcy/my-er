/** 莫兰迪色系预设 */
export const MORANDI_COLORS = [
  { id: 'sage', label: '灰绿', value: '#9CAF88' },
  { id: 'dusty-rose', label: '藕粉', value: '#C4A5A5' },
  { id: 'misty-blue', label: '雾蓝', value: '#8FA3B8' },
  { id: 'sand', label: '沙杏', value: '#C9B8A8' },
  { id: 'lavender', label: '雾紫', value: '#A89BB0' },
  { id: 'clay', label: '陶土', value: '#B8957A' },
  { id: 'slate', label: '岩灰', value: '#8B9099' },
  { id: 'moss', label: '苔绿', value: '#7A8F7A' },
];

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * @param {string | undefined | null} color
 * @returns {string | undefined}
 */
export function normalizeFieldColor(color) {
  if (!color || typeof color !== 'string') return undefined;
  const trimmed = color.trim();
  if (!trimmed) return undefined;
  if (HEX_RE.test(trimmed)) return trimmed.length === 4 ? expandShortHex(trimmed) : trimmed;
  return undefined;
}

/**
 * @param {string} short #rgb
 */
function expandShortHex(short) {
  const h = short.slice(1);
  return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
}

/**
 * 筛选开启时仅展示匹配颜色的标记，字段行仍全部显示。
 * @param {string | undefined} columnColor
 * @param {string | null | undefined} filter
 * @returns {string | undefined}
 */
export function resolveFieldColorDisplay(columnColor, filter) {
  const normalized = normalizeFieldColor(columnColor);
  if (!normalized) return undefined;
  if (!filter) return normalized;
  return normalized === filter ? normalized : undefined;
}

/**
 * @param {import('../model/erDiagram').ErDiagram | null | undefined} diagram
 * @returns {Array<{ color: string, count: number, label?: string }>}
 */
export function collectUsedFieldColors(diagram) {
  if (!diagram) return [];
  const counts = new Map();
  for (const table of diagram.tables) {
    for (const col of table.columns) {
      const color = normalizeFieldColor(col.color);
      if (!color) continue;
      counts.set(color, (counts.get(color) || 0) + 1);
    }
  }
  const presetByValue = new Map(MORANDI_COLORS.map((p) => [p.value.toLowerCase(), p.label]));
  return [...counts.entries()]
    .map(([color, count]) => ({
      color,
      count,
      label: presetByValue.get(color.toLowerCase()),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * @param {string} hex
 * @param {number} [alpha]
 */
export function fieldColorBackground(hex, alpha = 0.18) {
  const n = normalizeFieldColor(hex);
  if (!n) return undefined;
  const h = n.slice(1);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
