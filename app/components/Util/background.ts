import type p5 from "p5";
import { GRID, CANVAS_W, CANVAS_H, rows, cols } from "./constant";
import { checkerGrid } from "./types";

export function backGroundSetup(p: p5) {
  p.fill(255, 255, 255);
  p.stroke(0);
  p.strokeWeight(2);
  p.rect(0, 0, CANVAS_W, CANVAS_H);
}

export function backGrid(p: p5) {
  const split = 5;

  const spacingH = CANVAS_H / split;
  const spacingW = CANVAS_W / split;
  for (let i = 0; i < split; i++) {
    const x = spacingW * i + spacingW;
    const y = spacingH * i + spacingH;

    p.strokeWeight(1);
    p.stroke(0);

    p.line(x, 0, x, CANVAS_H);
    p.line(0, y, CANVAS_W, y);
  }
}

export function backMiniGrid(p: p5) {
  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      const x = ci * GRID;
      const y = ri * GRID;

      p.strokeWeight(0);
      p.fill(100, 100, 100);
      p.circle(x, y, 2);
    }
  }
}

// checkerBoard function

export function checkerboard(): checkerGrid[] {
  const black: checkerGrid[] = [];

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

// 선 그리고 교차점 반환
export function draw5x5(p: p5, checker: checkerGrid[]): [number, number][] {
  const xs: number[] = [];
  const ys: number[] = [];

  p.strokeWeight(1);
  p.stroke(0);

  for (let i = 3; i <= 15; i += 3) {
    const row = checker.find((c) => c.grid.ri === i);
    const col = checker.find((c) => c.grid.ci === i);

    if (row) { p.line(0, row.pos[1], CANVAS_W, row.pos[1]); ys.push(row.pos[1]); }
    if (col) { p.line(col.pos[0], 0, col.pos[0], CANVAS_H); xs.push(col.pos[0]); }
  }

  const intersections: [number, number][] = [];
  for (const x of xs) {
    for (const y of ys) {
      intersections.push([x, y]);
    }
  }
  return intersections;
}

export function vSensorPos(checker: checkerGrid[]): checkerGrid[] {
  const result: checkerGrid[] = [];

  for (let r = 3; r <= 15; r += 3) {
    for (let c = 3; c <= 15; c += 3) {
      const cell = checker.find((a) => a.grid.ri === r && a.grid.ci === c);
      if (cell) result.push(cell);
    }
  }
  return result;
}

export function setupVSensor(): [number, number][] {
  const result: [number, number][] = [];
  const spacing = CANVAS_W / 5;

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const x = spacing + spacing * r;
      const y = spacing + spacing * c;
      result.push([x, y]);
    }
  }
  return result;
}
