import p5 from "p5";
import { CheckerGrid } from "./Util/types";
import { GRID, CANVAS, TIME, TRAIL_SPEED } from "./Util/constant";
import { findPath } from "./Util/BFS";
import { computePos4Shader } from "./Util/shaderUtil";
import { drawCross } from "./drawings/draw";
import { FINE, snapFine } from "./drawings/checkerboard";
type Connection = { path: [number, number][]; t: number; color: [number, number, number]; instant?: boolean };

// 경로의 꺾이는 정점(+ 시작·끝) 좌표
function corners(path: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (let j = 0; j < path.length; j++) {
    const prev = path[j - 1];
    const next = path[j + 1];
    let isCorner = j === 0 || j === path.length - 1;
    if (prev && next) {
      if (path[j][0] - prev[0] !== next[0] - path[j][0] || path[j][1] - prev[1] !== next[1] - path[j][1]) isCorner = true;
    }
    if (isCorner) out.push(path[j]);
  }
  return out;
}

export const connections: Connection[] = [];
const MAX_CONNECTIONS = 30; // 메모리 상한

// 경로 위 셀 일부 제거해 구불구불하게 (step만큼의 그리드)
function path2AndFilter(checker: CheckerGrid[], from: [number, number], to: [number, number], step: number) {
  const path = findPath(checker, from, to, step);
  let filt = checker.filter(
    (c) =>
      !path.some(([x, y]) => c.pos[0] === x && c.pos[1] === y) ||
      (c.pos[0] === from[0] && c.pos[1] === from[1]) ||
      (c.pos[0] === to[0] && c.pos[1] === to[1])
  );
  filt = filt.filter(() => Math.random() > 0.35);
  return findPath(filt, from, to, step);
}

// 이미 그려진 연결들이 점유한 fine 셀 좌표 집합
function occupiedCells(): Set<string> {
  const occ = new Set<string>();
  for (const c of connections) for (const [x, y] of c.path) occ.add(`${x},${y}`);
  return occ;
}

// 두 점 연결 (fine 그리드). 색 지정. avoid=true면 이미 그려진 셀 회피. 코너 좌표 반환
export function addConnection(
  from: [number, number],
  to: [number, number],
  fg: CheckerGrid[],
  color: [number, number, number] = [89, 0, 255],
  avoid = false,
  step: number = FINE,
  instant = false
): [number, number][] {
  const snap = (p: [number, number]): [number, number] =>
    step === FINE ? snapFine(p) : [Math.round(p[0] / step) * step, Math.round(p[1] / step) * step];
  const a = snap(from);
  const b = snap(to);
  let grid = fg;
  if (avoid) {
    const occ = occupiedCells();
    occ.delete(`${a[0]},${a[1]}`); // 시작·끝은 허용
    occ.delete(`${b[0]},${b[1]}`);
    grid = fg.filter((c) => !occ.has(`${c.pos[0]},${c.pos[1]}`));
  }
  const path = path2AndFilter(grid, a, b, step);
  if (path.length === 0) return [];
  if (connections.length >= MAX_CONNECTIONS) connections.shift();
  connections.push({ path, t: 0, color, instant });
  return corners(path);
}

// 매 프레임: 진행 + 그리기 + 끝난 것 제거
export function drawConnections(p: p5) {
  for (let i = connections.length - 1; i >= 0; i--) {
    const c = connections[i];
    if (c.path.length === 0) {
      connections.splice(i, 1);
      continue;
    }

    c.t += TIME * TRAIL_SPEED;
    const maxT = c.path.length * TIME;
    if (c.t >= maxT + TIME * 500) {
      connections.splice(i, 1);
      continue;
    }

    const drawCount = c.instant ? c.path.length - 1 : Math.floor(c.t / TIME);
    const cur = Math.max(0, Math.min(drawCount, c.path.length - 1));
    p.strokeCap(p.SQUARE);

    p.stroke(c.color[0], c.color[1], c.color[2]);
    p.strokeWeight(2);
    for (let j = 0; j < cur; j++) {
      const [x1, y1] = computePos4Shader(c.path[j]);
      const [x2, y2] = computePos4Shader(c.path[j + 1]);
      p.line(x1, y1, x2, y2);
    }

    // 꺾이는 정점마다 검은 원 + 흰 십자 (시작·끝 포함)
    for (let j = 0; j <= cur; j++) {
      const prev = c.path[j - 1];
      const next = c.path[j + 1];
      let corner = j === 0 || j === c.path.length - 1; // 시작·끝
      if (prev && next) {
        const d1x = c.path[j][0] - prev[0];
        const d1y = c.path[j][1] - prev[1];
        const d2x = next[0] - c.path[j][0];
        const d2y = next[1] - c.path[j][1];
        if (d1x !== d2x || d1y !== d2y) corner = true; // 방향 바뀜
      }
      if (!corner) continue;
      const [x, y] = computePos4Shader(c.path[j]);
      p.noStroke();
      p.fill(c.color[0], c.color[1], c.color[2]);
      p.circle(x, y, GRID * 0.2);
    }
  }
}
