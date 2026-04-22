import type p5 from "p5";
import { CheckerGrid, VSensor } from "../Util/types";
import { GRID, CANVAS } from "../Util/constant";

export function checkerboard(): CheckerGrid[] {
  const black: CheckerGrid[] = [];

  for (let ri = 1; ri < 30; ri++) {
    for (let ci = 1; ci < 30; ci++) {
      if ((ri + ci) % 2 === 0) continue;
      const x = ci * GRID;
      const y = ri * GRID;

      black.push({ grid: { ri: Math.floor(ri / 2), ci: Math.floor(ci / 2) }, pos: [x, y] });
    }
  }
  return black;
}

export function draw5x5(p: p5, clicks: VSensor[]) {
  p.strokeWeight(1);
  p.stroke(0);
  // 선
  if (!clicks || clicks.length === 0) return;

  const xs = [...new Set(clicks.map((c) => c.checkerGrid.pos[0]))];
  const ys = [...new Set(clicks.map((c) => c.checkerGrid.pos[1]))];
  for (const x of xs) p.line(x, 0, x, CANVAS);
  for (const y of ys) p.line(0, y, CANVAS, y);
}
