import { CheckerGrid } from "../Util/types";

export function buildTapestryLines(
  fg: CheckerGrid[],
  occupied: [number, number][],
  maxLines: number,
  grid: number
): number[] {
  const nodes = fg
    .filter((f) => !occupied.some((o) => o[0] === f.pos[0] && o[1] === f.pos[1]))
    .map((f) => f.pos);

  if (nodes.length < 2) return [];

  const lines: number[] = [];
  let attempts = 0;

  while (lines.length / 4 < maxLines && attempts < maxLines * 10) {
    attempts++;
    const a = nodes[Math.floor(Math.random() * nodes.length)];
    const b = nodes[Math.floor(Math.random() * nodes.length)];
    if (a === b) continue;
    const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (dist > grid * 3) continue; // 인접한 그리드끼리만
    lines.push(a[0], a[1], b[0], b[1]);
  }

  return lines;
}
