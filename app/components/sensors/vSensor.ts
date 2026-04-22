import type p5 from "p5";
import { CheckerGrid, VSensor, CheckerDistStep } from "../Util/types";
import { GRID } from "../Util/constant";
import { drawCircleCross } from "../drawings/drawings";

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
      result.push({ checkerGrid: { grid: { ri: row.ri, ci: col.ci }, pos: [col.x, row.y] }, near: [], clickCount: 0, t: 60 });
    }
  }
  return result;
}

export function snapToSensor(p: p5, src: VSensor[]): VSensor {
  let closest: VSensor = { checkerGrid: { grid: { ri: 0, ci: 0 }, pos: [0, 0] }, near: [], clickCount: 0, t: 0 };
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

export function findNearCheck(p: p5, point: VSensor, src: CheckerGrid[]): CheckerDistStep[] {
  const near: CheckerDistStep[] = [];
  for (const c of src) {
    const [x, y] = c.pos;
    const d = p.dist(point.checkerGrid.pos[0], point.checkerGrid.pos[1], x, y);
    if (d <= GRID) near.push({ checkerGrid: c, distStep: 1 });
    if (d > GRID && d <= GRID * 2) near.push({ checkerGrid: c, distStep: 2 });
  }
  return near;
}

export function updateVSensor(p: p5, src: VSensor[], t: number) {
  for (const c of src) {
    if (c.clickCount > 0) {
      for (const n of c.near) {
        drawCircleCross(p, n.checkerGrid.pos[0], n.checkerGrid.pos[1]);
      }
      c.t -= t;
      if (c.t <= 0) {
        c.clickCount--;
      }
    }
  }
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
