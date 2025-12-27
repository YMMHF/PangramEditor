export const TILE_SIZE = 44; 
export const TRAY_GRID_ROWS = 7;

export const HIRAGANA_GRID = [
  ["わ", "ら", "や", "ま", "は", "な", "た", "さ", "か", "あ"],
  [null, "り", null, "み", "ひ", "に", "ち", "し", "き", "い"],
  [null, "る", "ゆ", "む", "ふ", "ぬ", "つ", "す", "く", "う"],
  [null, "れ", null, "め", "へ", "ね", "て", "せ", "け", "え"],
  ["を", "ろ", "よ", "も", "ほ", "の", "と", "そ", "こ", "お"],
  ["ん", null, null, null, null, null, null, null, null, null],
];

export const HIRAGANA = HIRAGANA_GRID.flat().filter((char): char is string => char !== null);

// グループ用カラーパレット
export const GROUP_COLORS = [
  { border: "#3b82f6", bg: "#dbeafe", text: "#1e40af" }, // Blue
  { border: "#10b981", bg: "#d1fae5", text: "#065f46" }, // Emerald
  { border: "#f59e0b", bg: "#fef3c7", text: "#92400e" }, // Amber
  { border: "#ef4444", bg: "#fee2e2", text: "#991b1b" }, // Red
  { border: "#8b5cf6", bg: "#ede9fe", text: "#5b21b6" }, // Violet
  { border: "#ec4899", bg: "#fce7f3", text: "#9d174d" }, // Pink
];