import type p5 from "p5";
import { GRID, CANVAS_W, CANVAS_H, Pos } from "./Util/types";

const ROWS = CANVAS_H / GRID;
const COLS = CANVAS_W / GRID;
const MAX_NODES = 20;
const BRANCH_CHANCE = 0.25;

// ── 그리드 노드 ───────────────────────────────────────────────────────────

type GridNode = { ci: number; ri: number };

function getCenter(node: GridNode): Pos {
  return {
    x: node.ci * GRID + GRID / 2,
    y: node.ri * GRID + GRID / 2,
  };
}

// 8방향 이웃
function getNeighbors(node: GridNode): GridNode[] {
  const { ci, ri } = node;
  return [
    { ci: ci + 1, ri },
    { ci: ci - 1, ri },
    { ci, ri: ri + 1 },
    { ci, ri: ri - 1 },
    { ci: ci + 1, ri: ri + 1 },
    { ci: ci - 1, ri: ri - 1 },
    { ci: ci + 1, ri: ri - 1 },
    { ci: ci - 1, ri: ri + 1 },
  ].filter((n) => n.ci >= 0 && n.ci < COLS && n.ri >= 0 && n.ri < ROWS);
}

function nodeKey(node: GridNode) {
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

  const path: Pos[] = [];
  const visited = new Set<string>();

  const stack: { node: GridNode; parentPos: Pos }[] = [
    {
      node: { ci: startCi, ri: startRi },
      parentPos: { x: startX, y: startY },
    },
  ];

  //스택 안에 뭐가 있고 다녀간 곳 길이가 최대 노드 이하일때
  while (stack.length > 0 && path.length < MAX_NODES * 2) {
    
    //그리드 상 위치랑 픽셀 위치 꺼냄 
    const { node, parentPos } = stack.pop()!;
    
    //그리드 상 위치 - visited 에 있는지 확인 
    const key = nodeKey(node);
    if (visited.has(key)) continue;

    const { x, y } = getCenter(node);
    const r = Math.floor(y / GRID);
    const c = Math.floor(x / GRID);
    if (occupied[r]?.[c]) continue;

    visited.add(key);
    path.push(parentPos, { x, y });

    const neighbors = getNeighbors(node).filter((n) => !visited.has(nodeKey(n)));
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
  path: Pos[],
  treeOccupied: boolean[][],
  riverOccupied: boolean[][],
  t: number
) {
  const drawCount = Math.floor(t * (path.length / 2)) * 2;

  p.stroke(40);
  p.strokeWeight(1);
  p.noFill();

  for (let i = 0; i < drawCount; i += 2) {
    const from = path[i];
    const to = path[i + 1];
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
