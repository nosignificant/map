import type p5 from "p5";
import { CANVAS_H, CANVAS_W, GRID, TreeParams } from "./Util/types";
import { act } from "react";

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
  branch(p, x, y, angle, params.len, params.depth, params, occupied, treeOccupied, t, 0, 3);
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
  currentDepth: number,
  reversed: number
) {
  if (currentDepth >= maxDepth || len < 2) return;

  //그려진 이미지면 반대방향으로 시도해보고 반대방향도 안되면 루프 끝 
  const r = Math.floor(y / GRID);
  const c = Math.floor(x / GRID);

  const depthProgress = t * maxDepth;

  const localT = Math.min(1, depthProgress - currentDepth);
  const actualLen = len * localT;

  if (occupied[r]?.[c]) {
    if (reversed > 0) {
      branch(p, x, y, angle + Math.PI, len, maxDepth, params, occupied, treeOccupied, t, currentDepth, reversed - 1);
    }
    else {
      const nextX = x + Math.cos(angle + Math.PI) * actualLen;
      const nextY = y + Math.sin(angle + Math.PI) * actualLen;  // nextX → nextY

      drawLine(p, params, x, y, nextX, nextY);
      branch(p, nextX, nextY, angle + Math.PI, len, maxDepth, params, occupied, treeOccupied, t, currentDepth + 1, 0);
    }
    return;
  }

  //현재 깊이
  if (localT <= 0) return;

  //현재 길이

  const x2 = x + Math.cos(angle) * actualLen;
  const y2 = y + Math.sin(angle) * actualLen;


  //앞으로 각도 결정 

  const steps = Math.ceil(actualLen / GRID);
  if (isTreeOccupied(steps, actualLen, x, y, x2, y2, treeOccupied)) return;
  drawLine(p, params, x, y, x2, y2);
  setTreeOccupied(steps, actualLen, x, y, x2, y2, treeOccupied);

  if (localT >= 1) {
    branch(p, x2, y2, angle - params.spread, len * 0.7, maxDepth, params, occupied, treeOccupied, t, currentDepth + 1, reversed);
    branch(p, x2, y2, angle + params.spread, len * 0.7, maxDepth, params, occupied, treeOccupied, t, currentDepth + 1, reversed);
  }
}

function drawLine(
  p: p5,
  params: TreeParams,
  x: number,
  y: number,
  x2: number,
  y2: number,) {

  p.stroke(params.color[0], params.color[1], params.color[2]);
  p.strokeWeight(1);
  p.line(x, y, x2, y2);

}

function isTreeOccupied(
  steps: number,
  actualLen: number,
  x: number,
  y: number,
  x2: number,
  y2: number,
  treeOccupied: boolean[][]): boolean {
  for (let i = 1; i <= steps; i++) {
    const tx = x + (x2 - x) * (i / steps);
    const ty = y + (y2 - y) * (i / steps);
    const tr = Math.floor(ty / GRID);
    const tc = Math.floor(tx / GRID);
    if (treeOccupied[tr]?.[tc]) return true;
  }
  return false;
}

function setTreeOccupied(
  steps: number,
  actualLen: number,
  x: number,
  y: number,
  x2: number,
  y2: number,
  treeOccupied: boolean[][]) {
  for (let i = 0; i <= steps; i++) {
    const tx = x + (x2 - x) * (i / steps);
    const ty = y + (y2 - y) * (i / steps);
    const tr = Math.floor(ty / GRID);
    const tc = Math.floor(tx / GRID);
    if (tr >= 0 && tr < rows && tc >= 0 && tc < cols) {
      treeOccupied[tr][tc] = true;
    }
  }
}