import type p5 from "p5";
import { CheckerGrid, VSensor } from "../Util/types";
import { GRID, CANVAS } from "../Util/constant";

export function fullGrid(): CheckerGrid[] {
  const fullGrid: CheckerGrid[] = [];

  for (let ri = 0; ri < 29; ri++) {
    for (let ci = 0; ci < 29; ci++) {
      const x = GRID + ci * GRID;
      const y = GRID + ri * GRID;

      fullGrid.push({ grid: { ri: ri, ci: ci }, pos: [x, y] });
    }
  }
  return fullGrid;
}

export const FINE = GRID / 2; // 촘촘한 그리드 칸 크기

// fullGrid보다 촘촘한 GRID/2 그리드 (path2AndFilter·drawConnection용)
export function fineGrid(): CheckerGrid[] {
  const out: CheckerGrid[] = [];
  const n = Math.floor(CANVAS / FINE);
  for (let ri = 1; ri < n; ri++) {
    for (let ci = 1; ci < n; ci++) {
      out.push({ grid: { ri, ci }, pos: [ci * FINE, ri * FINE] });
    }
  }
  return out;
}

// 좌표를 가장 가까운 fine 격자점으로 스냅
export function snapFine(p: [number, number]): [number, number] {
  return [Math.round(p[0] / FINE) * FINE, Math.round(p[1] / FINE) * FINE];
}

export const ULTRA = GRID / 4; // base끼리용 더 촘촘한 칸

// fineGrid보다 더 촘촘한 GRID/4 그리드 (base boid끼리 연결용)
export function ultraGrid(): CheckerGrid[] {
  const out: CheckerGrid[] = [];
  const n = Math.floor(CANVAS / ULTRA);
  for (let ri = 1; ri < n; ri++) {
    for (let ci = 1; ci < n; ci++) {
      out.push({ grid: { ri, ci }, pos: [ci * ULTRA, ri * ULTRA] });
    }
  }
  return out;
}

export function checkerboard(): CheckerGrid[] {
  const black: CheckerGrid[] = [];

  for (let ri = 0; ri < 29; ri++) {
    for (let ci = 0; ci < 29; ci++) {
      if (ci % 2 === 0 && ri % 2 === 1) continue;
      if (ci % 2 === 1 && ri % 2 === 0) continue;

      const x = GRID + ci * GRID;
      const y = GRID + ri * GRID;

      black.push({ grid: { ri: Math.floor(ri / 2), ci: Math.floor(ci / 2) }, pos: [x, y] });
    }
  }
  return black;
}

export function draw5x5(p: p5, clicks: VSensor[]) {
  p.strokeWeight(1);
  p.stroke(255);
  // 선
  if (!clicks || clicks.length === 0) return;

  const xs = [...new Set(clicks.map((c) => c.checkerGrid.pos[0]))];
  const ys = [...new Set(clicks.map((c) => c.checkerGrid.pos[1]))];
  for (const x of xs) p.line(x, 0, x, CANVAS);
  for (const y of ys) p.line(0, y, CANVAS, y);
}

export function snapToCheck(pos: [number, number], fg: CheckerGrid[]): [number, number] {
  let closest: [number, number] = [0, 0];
  let minDist = Infinity;
  for (const f of fg) {
    const d = Math.hypot(pos[0] - f.pos[0], pos[1] - f.pos[1]);
    if (d < minDist) {
      minDist = d;
      closest = f.pos;
    }
  }
  return closest;
}
