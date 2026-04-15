import type p5 from "p5";
import { GRID, CANVAS_W, CANVAS_H, RiverNode } from "./Util/types";

const ROWS = CANVAS_H / GRID;
const COLS = CANVAS_W / GRID;
const MAX_NODES = 200;
const BRANCH_CHANCE = 0.25;

// ── 삼각형 노드 ───────────────────────────────────────────────────────────

type TriNode = { ci: number; ri: number; isTop: boolean };

function getCenter(node: TriNode): RiverNode {
  const baseX = node.ci * GRID;
  const baseY = node.ri * GRID;
  return node.isTop
    ? { x: baseX + (2 * GRID) / 3, y: baseY + GRID / 3 }
    : { x: baseX + GRID / 3, y: baseY + (2 * GRID) / 3 };
}

function getNeighbors(node: TriNode): TriNode[] {
  const { ci, ri, isTop } = node;
  const candidates = isTop
    ? [
        { ci, ri, isTop: false },
        { ci: ci + 1, ri, isTop: true },
        { ci, ri: ri - 1, isTop: false },
      ]
    : [
        { ci, ri, isTop: true },
        { ci: ci - 1, ri, isTop: false },
        { ci, ri: ri + 1, isTop: true },
      ];

  return candidates.filter(
    (n) => n.ci >= 0 && n.ci < COLS && n.ri >= 0 && n.ri < ROWS
  );
}

function nodeKey(node: TriNode) {
  return `${node.ci},${node.ri},${node.isTop ? 1 : 0}`;
}

// ── 경로 한 번만 계산 ─────────────────────────────────────────────────────

export function buildRiverPath(
  startX: number,
  startY: number,
  occupied: boolean[][]
): RiverNode[] {
  const startCi = Math.floor(startX / GRID);
  const startRi = Math.floor(startY / GRID);
  // 대각선 기준: x%GRID > y%GRID 이면 top 삼각형
  const startIsTop = startX % GRID > startY % GRID;

  const path: RiverNode[] = [];
  const visited = new Set<string>();

  // DFS 스택: { node, parentPos }
  const stack: { node: TriNode; parentPos: RiverNode }[] = [
    {
      node: { ci: startCi, ri: startRi, isTop: startIsTop },
      parentPos: { x: startX, y: startY },
    },
  ];

  while (stack.length > 0 && path.length < MAX_NODES) {
    const { node, parentPos } = stack.pop()!;
    const key = nodeKey(node);
    if (visited.has(key)) continue;

    // occupied 체크
    const { x, y } = getCenter(node);
    const r = Math.floor(y / GRID);
    const c = Math.floor(x / GRID);
    if (occupied[r]?.[c]) continue;

    visited.add(key);

    // 이전 점 → 현재 점 선분을 경로에 추가 (쌍으로 저장)
    path.push(parentPos, { x, y });

    // 이웃 섞어서 스택에 추가
    const neighbors = getNeighbors(node).filter((n) => !visited.has(nodeKey(n)));
    shuffle(neighbors);

    // 메인 가지
    if (neighbors.length > 0) {
      stack.push({ node: neighbors[0], parentPos: { x, y } });
    }

    // 분기
    if (neighbors.length > 1 && Math.random() < BRANCH_CHANCE) {
      stack.push({ node: neighbors[1], parentPos: { x, y } });
    }
  }

  return path;
}

// ── 매 프레임 t만큼만 그리기 ──────────────────────────────────────────────

export function drawRiverPath(
  p: p5,
  path: RiverNode[],
  treeOccupied: boolean[][],
  t: number
) {
  const drawCount = Math.floor(t * (path.length / 2)) * 2; // 쌍 단위로 자르기

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
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) treeOccupied[r][c] = true;

    p.line(from.x, from.y, to.x, to.y);
  }
}

// ── 유틸 ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
