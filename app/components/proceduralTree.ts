import type p5 from "p5";
import { TreeParams, Pos } from "./Util/types";
import { CANVAS_H, CANVAS_W, GRID, rows, cols } from "./Util/constant";
import { drawCircleCross } from "./Util/drawings";

// t: 0 = 아무것도 없음, 1 = 완전히 자란 상태
export function drawTree(
  p: p5,
  pos: Pos,
  angle: number,
  params: TreeParams,
  occupied: boolean[][],
  treeOccupied: boolean[][],
  t: number = 1
) {
  p.push();
  p.noFill();

  branch(p, pos, angle, params.len, params.depth, params, occupied, treeOccupied, t, 0, 3);
  p.pop();
}

function branch(
  p: p5,
  pos: Pos,
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
  // 캔버스 밖이면 그냥 멈춤
  if (pos.x < 0 || pos.x > CANVAS_W || pos.y < 0 || pos.y > CANVAS_H) return;

  const r = Math.floor(pos.y / GRID);
  const c = Math.floor(pos.x / GRID);

  const depthProgress = t * maxDepth;
  const localT = Math.min(1, depthProgress - currentDepth);
  const actualLen = len * localT;

  if (occupied[r]?.[c]) {
    if (reversed > 0) {
      branch(
        p,
        pos,
        angle + Math.PI,
        len,
        maxDepth,
        params,
        occupied,
        treeOccupied,
        t,
        currentDepth,
        reversed - 1
      );
    } else {
      const nextX = pos.x + Math.cos(angle + Math.PI) * actualLen;
      const nextY = pos.y + Math.sin(angle + Math.PI) * actualLen;
      drawLine(p, params, pos.x, pos.y, nextX, nextY);
      branch(
        p,
        { x: nextX, y: nextY },
        angle + Math.PI,
        len,
        maxDepth,
        params,
        occupied,
        treeOccupied,
        t,
        currentDepth + 1,
        0
      );
    }
    return;
  }

  // 끝점을 그리드에 스냅
  const x2 = Math.round((pos.x + Math.cos(angle) * actualLen) / GRID) * GRID;
  const y2 = Math.round((pos.y + Math.sin(angle) * actualLen) / GRID) * GRID;
  const steps = Math.ceil(actualLen / GRID);

  if (isTreeOccupied(steps, actualLen, pos.x, pos.y, x2, y2, treeOccupied)) return;
  drawLine(p, params, pos.x, pos.y, x2, y2);
  setTreeOccupied(steps, actualLen, pos.x, pos.y, x2, y2, treeOccupied);

  if (localT >= 1) {
    branch(
      p,
      { x: x2, y: y2 },
      angle - params.spread,
      len * 0.8,
      maxDepth,
      params,
      occupied,
      treeOccupied,
      t,
      currentDepth + 1,
      reversed
    );
    branch(
      p,
      { x: x2, y: y2 },
      angle + params.spread,
      len * 0.8,
      maxDepth,
      params,
      occupied,
      treeOccupied,
      t,
      currentDepth + 1,
      reversed
    );
  }
}

function drawLine(p: p5, params: TreeParams, x: number, y: number, x2: number, y2: number) {
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
  treeOccupied: boolean[][]
): boolean {
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
  treeOccupied: boolean[][]
) {
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
