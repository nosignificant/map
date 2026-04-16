import type p5 from "p5";
import { Pos, Grid } from "./Util/types";
import { GRID, CANVAS_W, CANVAS_H } from "./Util/constant";
import { dilate } from "./Util/edgeDetection";

const ROWS = CANVAS_H / GRID;
const COLS = CANVAS_W / GRID;
const MAX_NODES = 20;
const BRANCH_CHANCE = 0.25;

// ── 그리드 노드 ───────────────────────────────────────────────────────────

function getCenter(node: Grid): Pos {
  return {
    x: node.ci * GRID,
    y: node.ri * GRID,
  };
}

// 8방향 이웃
function getNeighbors(node: Grid): Grid[] {
  const { ci, ri } = node;
  const straight = [
    { ci: ci + 1, ri },
    { ci: ci - 1, ri },
    { ci, ri: ri + 1 },
    { ci, ri: ri - 1 },
  ];
  const diagonal = [
    { ci: ci + 1, ri: ri + 1 },
    { ci: ci - 1, ri: ri - 1 },
    { ci: ci + 1, ri: ri - 1 },
    { ci: ci - 1, ri: ri + 1 },
  ];

  const result = [...straight];
  for (const d of diagonal) {
    if (Math.random() < 0.15) result.push(d); // 15% 확률로만 포함
  }
  return result.filter(
    (n) => n.ci >= 0 && n.ci < COLS && n.ri >= 0 && n.ri < ROWS
  );
}

function nodeKey(node: Grid) {
  return `${node.ci},${node.ri}`;
}

// ── 경로 한 번만 계산 ─────────────────────────────────────────────────────

export function buildRiverPath(
  startX: number,
  startY: number,
  occupied: boolean[][]
): Pos[] {
  const startCi = Math.floor(startX / GRID);
  const startRi = Math.floor(startY / GRID);

  //다녀간 곳들 목록
  const path: Pos[] = [];
  const visited = new Set<string>();

  const stack: { node: Grid; parentPos: Pos }[] = [
    {
      node: { ci: startCi, ri: startRi },
      parentPos: { x: startX, y: startY },
    },
  ];

  //스택 안에 뭐가 있고 다녀간 곳 길이가 최대 노드 이하일때
  while (stack.length > 0 && path.length < MAX_NODES * 2) {
    //스택에서 하나 꺼냄
    const { node, parentPos } = stack.pop()!;

    //그리드 상 위치 - visited 에 있는지 확인
    const key = nodeKey(node);
    if (visited.has(key)) continue;

    //이미지가 차지한 곳이면 건너 뜀
    const { x, y } = getCenter(node);
    const r = Math.floor(y / GRID);
    const c = Math.floor(x / GRID);
    if (occupied[r]?.[c]) continue;

    ////
    //위의 조건들 다 만족하면 추가
    ////
    visited.add(key);
    path.push(parentPos, { x, y });

    //마지막으로 간 곳의 8방향
    const neighbors = getNeighbors(node).filter(
      (n) => !visited.has(nodeKey(n))
    );
    shuffle(neighbors);

    if (neighbors.length > 0) {
      stack.push({ node: neighbors[0], parentPos: { x, y } });
    }
    if (neighbors.length > 1 && Math.random() < BRANCH_CHANCE) {
      stack.push({ node: neighbors[1], parentPos: { x, y } });
    }
  }

  return path;
}

// ── 매 프레임 t만큼만 그리기 ──────────────────────────────────────────────

export function drawRiverPath(
  p: p5,
  pos: Pos[],
  treeOccupied: boolean[][],
  riverOccupied: boolean[][],
  t: number
) {
  const drawCount = Math.floor(t * (pos.length / 2)) * 2;

  p.stroke(40);
  p.strokeWeight(1);
  p.noFill();

  for (let i = 0; i < drawCount; i += 2) {
    const from = pos[i];
    const to = pos[i + 1];
    if (!from || !to) break;

    const r = Math.floor(to.y / GRID);
    const c = Math.floor(to.x / GRID);
    if (treeOccupied[r]?.[c]) continue;
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      treeOccupied[r][c] = true;
      riverOccupied[r][c] = true;
    }

    p.line(from.x, from.y, to.x, to.y);
  }
}

export function riverRect(p: p5, riverOccupied: boolean[][]) {
  p.noStroke();
  p.fill(100, 150, 255);
  for (let r = 0; r < riverOccupied.length; r++) {
    for (let c = 0; c < riverOccupied[r].length; c++) {
      if (riverOccupied[r][c]) {
        p.rect(c * GRID, r * GRID, GRID, GRID);
      }
    }
  }
}

export function offsetRiverRect(p: p5, riverOccupied: boolean[][]) {
  const dil = dilate(riverOccupied);

  p.stroke(255, 0, 0);
  p.strokeWeight(1);
  p.noFill();

  for (let r = 0; r < dil.length; r++) {
    for (let c = 0; c < dil[r].length; c++) {
      if (!dil[r][c]) continue; // dil 셀만

      const x = c * GRID;
      const y = r * GRID;

      // dil 바깥 면에 선
      if (!dil[r - 1]?.[c]) p.line(x, y, x + GRID, y);
      if (!dil[r + 1]?.[c]) p.line(x, y + GRID, x + GRID, y + GRID);
      if (!dil[r]?.[c - 1]) p.line(x, y, x, y + GRID);
      if (!dil[r]?.[c + 1]) p.line(x + GRID, y, x + GRID, y + GRID);
    }
  }
}

// riverOccupied만 채우고 그리지 않음 (레이어 순서 조절용)
export function markRiverOccupied(
  path: Pos[],
  riverOccupied: boolean[][],
  t: number
) {
  const drawCount = Math.floor(t * (path.length / 2)) * 2;
  for (let i = 0; i < drawCount; i += 2) {
    const to = path[i + 1];
    if (!to) break;
    const r = Math.floor(to.y / GRID);
    const c = Math.floor(to.x / GRID);
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      riverOccupied[r][c] = true;
    }
  }
}

// ── 유틸 ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
