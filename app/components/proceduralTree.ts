import type p5 from "p5";
import { CANVAS_H, CANVAS_W, GRID } from "./types";

export type TreeParams = {
  len: number;
  depth: number;
  strokeW: number;
  color: [number, number, number];
  spread: number;
};

const rows = CANVAS_H / GRID;
const cols = CANVAS_W / GRID;

// t: 0 = 아무것도 없음, 1 = 완전히 자란 상태
// imageRects: 나무가 침범하면 안 되는 모든 이미지 영역
export function drawTree(
  p: p5,
  x: number,
  y: number,
  angle: number,
  params: TreeParams,
  occupied: boolean[][],
  treeOccupied: boolean[][],

  t: number = 1
) {
  p.push();
  p.noFill();
  branch(p, x, y, angle, params.len, params.depth, params, occupied, treeOccupied, t, 0);
  p.pop();
}

function branch(
  p: p5,
  x: number,
  y: number,
  angle: number,
  len: number,
  maxDepth: number,
  params: TreeParams,
  occupied: boolean[][],
  treeOccupied: boolean[][],

  t: number,
  currentDepth: number
) {
  if (currentDepth >= maxDepth || len < 2) return;

  const r = Math.floor(y / GRID);
  const c = Math.floor(x / GRID);
  if (occupied[r]?.[c] || treeOccupied[r]?.[c]) return;

  // 시작점 마킹 — 끝점 마킹하면 재귀 시작점이 막힘
  if (r >= 0 && r < rows && c >= 0 && c < cols) {
    treeOccupied[r][c] = true;
  }

  const depthProgress = t * maxDepth;
  const localT = Math.min(1, depthProgress - currentDepth);
  if (localT <= 0) return;

  const actualLen = len * localT;
  const x2 = x + Math.cos(angle) * actualLen;
  const y2 = y + Math.sin(angle) * actualLen;

  p.stroke(params.color[0], params.color[1], params.color[2]);
  p.strokeWeight(1);
  p.line(x, y, x2, y2);

  if (localT >= 1) {
    branch(p, x2, y2, angle - params.spread, len * 0.7, maxDepth, params, occupied, treeOccupied, t, currentDepth + 1);
    branch(p, x2, y2, angle + params.spread, len * 0.7, maxDepth, params, occupied, treeOccupied, t, currentDepth + 1);
  }



}