import type p5 from "p5";
import { CheckerGrid, VSensor } from "../Util/types";
import { GRID, CANVAS_W, CANVAS_H, rows, cols } from "../Util/constant";

export function checkerboard(): CheckerGrid[] {
  const black: CheckerGrid[] = [];

  for (let ri = 1; ri <= 30; ri++) {
    for (let ci = 1; ci <= 30; ci++) {
      if ((ri + ci) % 2 === 0) continue;

      const x = ci * GRID;
      const y = ri * GRID;

      black.push({ grid: { ri: Math.floor(ri / 2), ci: Math.floor(ci / 2) }, pos: [x, y] });
    }
  }
  return black;
}
export function initVSensor(checker: CheckerGrid[]): VSensor[] {
  const result: VSensor[] = [];
  const rows: { y: number; ri: number }[] = [];
  const cols: { x: number; ci: number }[] = [];

  for (let i = 3; i <= 15; i += 3) {
    const row = checker.find((c) => c.grid.ri === i);
    const col = checker.find((c) => c.grid.ci === i);
    if (row) rows.push({ y: row.pos[1], ri: row.grid.ri });
    if (col) cols.push({ x: col.pos[0], ci: col.grid.ci });
  }

  for (const col of cols) {
    for (const row of rows) {
      result.push({ checkerGrid: { grid: { ri: row.ri, ci: col.ci }, pos: [col.x, row.y] }, clickCount: 0, t: 60 });
    }
  }
  return result;
}
export function draw5x5(p: p5, clicks: VSensor[]) {
  p.strokeWeight(1);
  p.stroke(0);
  // 선
  if (!clicks || clicks.length === 0) return;

  const xs = [...new Set(clicks.map((c) => c.checkerGrid.pos[0]))];
  const ys = [...new Set(clicks.map((c) => c.checkerGrid.pos[1]))];
  for (const x of xs) p.line(x, 0, x, CANVAS_H);
  for (const y of ys) p.line(0, y, CANVAS_W, y);
}

export function vSensored(p: p5, src: VSensor[]) {
  if (!src || src.length === 0) return;

  for (const c of src) {
    const [x, y] = [c.checkerGrid.pos[0], c.checkerGrid.pos[1]];

    if (c.clickCount > 0) {
      p.circle(x, y, GRID + c.t * c.clickCount);
    }
  }
}

export function snapToSensor(p: p5, src: VSensor[]): VSensor {
  let closest: VSensor = { checkerGrid: { grid: { ri: 0, ci: 0 }, pos: [0, 0] }, clickCount: 0, t: 0 };
  let minDist: number = Infinity;
  for (const c of src) {
    const [x, y] = c.checkerGrid.pos;
    const d = p.dist(p.mouseX, p.mouseY, x, y);
    if (d < minDist) {
      minDist = d;
      closest = c;
    }
  }
  return closest;
}

export function foundNearCheck(): CheckerGrid[] {
  const near: CheckerGrid[] = [];

  return near;
}

export function updateVSensor(p: p5, src: VSensor[], t: number) {
  for (const c of src) {
    if (c.clickCount > 0) {
      c.t -= t;
      if (c.t <= 0) {
        c.clickCount--;
        c.t = 60;
      }
    }
  }
}
