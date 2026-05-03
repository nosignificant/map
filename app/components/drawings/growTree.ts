import p5 from "p5";
import { GRID, CANVAS } from "../Util/constant";

export type TreeSeg = {
  from: [number, number];
  to: [number, number];
  depth: number;
  parent: number; // 부모 segment의 index, -1이면 뿌리
  grown: number; // 0~1, 현재 자라난 정도
};

// 8방향 단위 벡터 (인덱스 0~7, 시계 반대 방향)
// 0=E, 1=NE, 2=N, 3=NW, 4=W, 5=SW, 6=S, 7=SE
const DIR8: [number, number][] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

// 방향은 8방향 격자 정렬, 길이는 자유 (baseLen 기반 랜덤)
export function buildTree(
  seed: [number, number],
  startDir: number = 2, // 시작 방향 인덱스 (2 = 북쪽)
  baseLen: number = GRID / 2,
  maxDepth: number = 7
): TreeSeg[] {
  const segs: TreeSeg[] = [];

  function grow(from: [number, number], dir: number, len: number, depth: number, parent: number) {
    if (depth >= maxDepth) return;
    const [dx, dy] = DIR8[dir];
    const to: [number, number] = [from[0] + dx * len, from[1] + dy * len];
    if (to[0] < 0 || to[0] > CANVAS || to[1] < 0 || to[1] > CANVAS) return;

    const idx = segs.length;
    segs.push({ from, to, depth, parent, grown: 0 });

    // 분기: 항상 2개, 방향은 현재 ±45° 이내
    const used = new Set<number>();
    for (let i = 0; i < 2; i++) {
      const offset = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
      const next = (dir + offset + 8) % 8;
      if (used.has(next)) continue;
      used.add(next);
      const newLen = len * (0.6 + Math.random() * 0.2);
      grow(to, next, newLen, depth + 1, idx);
    }
  }

  grow(seed, startDir, baseLen, 0, -1);
  return segs;
}

// occupied 격자 중심에서 GRID*0.5 이내에 segment 끝점이 있으면 blocked
function isBlocked(to: [number, number], occupied: [number, number][]): boolean {
  const r2 = GRID * 0.5 * (GRID * 0.5);
  for (const [ox, oy] of occupied) {
    const dx = to[0] - ox;
    const dy = to[1] - oy;
    if (dx * dx + dy * dy < r2) return true;
  }
  return false;
}

export function updateTree(segs: TreeSeg[], occupied: [number, number][], growSpeed: number = 0.04, decaySpeed: number = 0.08) {
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const blocked = isBlocked(s.to, occupied);
    const parentReady = s.parent === -1 ? true : segs[s.parent].grown > 0.9;

    if (blocked || !parentReady) {
      s.grown = Math.max(0, s.grown - decaySpeed);
    } else {
      s.grown = Math.min(1, s.grown + growSpeed);
    }
  }
}

export function drawTree(p: p5, segs: TreeSeg[], maxDepth: number = 7) {
  p.push();
  p.translate(-CANVAS / 2, -CANVAS / 2);

  // 각 segment의 자식 수 세기 (분기점/끝점 판별용)
  const childCount: number[] = new Array(segs.length).fill(0);
  for (const s of segs) {
    if (s.parent !== -1) childCount[s.parent]++;
  }

  p.noFill();
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    if (s.grown <= 0.01) continue;
    const ex = s.from[0] + (s.to[0] - s.from[0]) * s.grown;
    const ey = s.from[1] + (s.to[1] - s.from[1]) * s.grown;
    p.strokeWeight(2);
    p.stroke(0, 0, 255);
    p.line(s.from[0], s.from[1], ex, ey);

    // 충분히 자란 segment의 to에 원
    // - childCount === 0: 끝나는 지점 (leaf)
    // - childCount >= 2: 가지가 갈라지는 분기점
    if (s.grown >= 0.95 && (childCount[i] === 0 || childCount[i] >= 2)) {
      p.noStroke();
      p.fill(0, 0, 255);
      p.circle(s.to[0], s.to[1], 8);
      p.noFill();
    }
  }
  p.pop();
}
