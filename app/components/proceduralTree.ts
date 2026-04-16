import type p5 from "p5";
import { TreeParams, Pos } from "./Util/types";
import { CANVAS_H, CANVAS_W, GRID, rows, cols } from "./Util/constant";
import { drawCircleCross } from "./Util/drawings";

// t: 0 = 아무것도 없음, 1 = 완전히 자란 상태
// imageRects: 나무가 침범하면 안 되는 모든 이미지 영역
export function drawTree(
  p: p5,
  pos: Pos,
  angle: number,
  params: TreeParams,
  occupied: boolean[][],
  treeOccupied: boolean[][],
  t: number = 1,
  riverOccupied: boolean[][] = []
) {
  p.push();
  p.noFill();
  branch(
    p,
    pos,
    angle,
    params.len,
    params.depth,
    params,
    occupied,
    treeOccupied,
    riverOccupied,
    t,
    0,
    3
  );
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
  riverOccupied: boolean[][],
  t: number,
  currentDepth: number,
  reversed: number
) {
  // 캔버스 밖이면 그냥 멈춤
  if (pos.x < 0 || pos.x > CANVAS_W || pos.y < 0 || pos.y > CANVAS_H) return;

  if (currentDepth >= maxDepth || len < 2) {
    drawCircleCross(p, pos.x, pos.y);
    return;
  }

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
        riverOccupied,
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
        riverOccupied,
        t,
        currentDepth + 1,
        0
      );
    }
    return;
  }

  if (localT <= 0) {
    drawCircleCross(p, pos.x, pos.y);
    return;
  }

  const x2 = pos.x + Math.cos(angle) * actualLen;
  const y2 = pos.y + Math.sin(angle) * actualLen;
  const steps = Math.ceil(actualLen / GRID);

  // river 셀에 막히면 그 직전까지 그리고 수직으로 우회
  const riverHit = findRiverHit(steps, pos.x, pos.y, x2, y2, riverOccupied);
  if (riverHit) {
    drawLine(p, params, pos.x, pos.y, riverHit.x, riverHit.y);
    setTreeOccupied(
      Math.ceil(riverHit.dist / GRID),
      riverHit.dist,
      pos.x,
      pos.y,
      riverHit.x,
      riverHit.y,
      treeOccupied
    );

    // 수직 방향(±90°) 중 비어있는 쪽으로 우회
    const redirectLen = GRID * 3;
    for (const da of [-Math.PI / 2, Math.PI / 2]) {
      const rx = riverHit.x + Math.cos(angle + da) * redirectLen;
      const ry = riverHit.y + Math.sin(angle + da) * redirectLen;
      const rr = Math.floor(ry / GRID);
      const rc = Math.floor(rx / GRID);
      if (
        !riverOccupied[rr]?.[rc] &&
        !treeOccupied[rr]?.[rc] &&
        !occupied[rr]?.[rc]
      ) {
        drawLine(p, params, riverHit.x, riverHit.y, rx, ry);
        branch(
          p,
          { x: rx, y: ry },
          angle,
          len * 0.9,
          maxDepth,
          params,
          occupied,
          treeOccupied,
          riverOccupied,
          t,
          currentDepth + 1,
          reversed
        );
        break;
      }
    }
    return;
  }

  if (isTreeOccupied(steps, actualLen, pos.x, pos.y, x2, y2, treeOccupied))
    return;
  drawLine(p, params, pos.x, pos.y, x2, y2);
  setTreeOccupied(steps, actualLen, pos.x, pos.y, x2, y2, treeOccupied);

  if (localT >= 1) {
    branch(
      p,
      { x: x2, y: y2 },
      angle - params.spread,
      len * 0.9,
      maxDepth,
      params,
      occupied,
      treeOccupied,
      riverOccupied,
      t,
      currentDepth + 1,
      reversed
    );
    branch(
      p,
      { x: x2, y: y2 },
      angle + params.spread,
      len * 0.9,
      maxDepth,
      params,
      occupied,
      treeOccupied,
      riverOccupied,
      t,
      currentDepth + 1,
      reversed
    );
  }
}

function drawLine(
  p: p5,
  params: TreeParams,
  x: number,
  y: number,
  x2: number,
  y2: number
) {
  p.stroke(params.color[0], params.color[1], params.color[2]);
  p.strokeWeight(1);
  p.line(x, y, x2, y2);
}

// 경로 위에서 riverOccupied 셀에 처음 닿는 직전 지점 반환
function findRiverHit(
  steps: number,
  x: number,
  y: number,
  x2: number,
  y2: number,
  riverOccupied: boolean[][]
): { x: number; y: number; dist: number } | null {
  for (let i = 1; i <= steps; i++) {
    const tx = x + (x2 - x) * (i / steps);
    const ty = y + (y2 - y) * (i / steps);
    const tr = Math.floor(ty / GRID);
    const tc = Math.floor(tx / GRID);
    if (riverOccupied[tr]?.[tc]) {
      // 막힌 셀 직전 지점
      const prevRatio = Math.max(0, (i - 1) / steps);
      const px = x + (x2 - x) * prevRatio;
      const py = y + (y2 - y) * prevRatio;
      const dist = Math.hypot(px - x, py - y);
      return { x: px, y: py, dist };
    }
  }
  return null;
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
