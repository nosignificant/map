import type p5 from "p5";
import { CheckerGrid, VSensor, VsensorImagePos, Connect } from "../Util/types";
import { GRID, TIME, TRAIL_SPEED, STEP_OFFSETS } from "../Util/constant";
import { findPath } from "../Util/BFS";
import { vSensorUnits } from "../Util/imageStore";
import { updateHistoryArr } from "../SketchHistory";

export function initVSensor(checker: CheckerGrid[]): VSensor[] {
  const result: VSensor[] = [];
  const rows: { y: number; ri: number }[] = [];
  const cols: { x: number; ci: number }[] = [];

  for (let i = 4; i < 30; i += 5) {
    const row = checker.find((c) => c.grid.ri === i);
    const col = checker.find((c) => c.grid.ci === i);
    if (row) rows.push({ y: row.pos[1], ri: row.grid.ri });
    if (col) cols.push({ x: col.pos[0], ci: col.grid.ci });
  }

  for (const col of cols) {
    for (const row of rows) {
      result.push({
        checkerGrid: { grid: { ri: row.ri, ci: col.ci }, pos: [col.x, row.y] },
        near: [],
        clickCount: 0,
        connect: { p1: [0, 0], p2: [0, 0], path: [], t: 0, shrinking: false },
        tentacles: [],
        strength: 0,
        currentStage: 0,
      });
    }
  }

  // 가장 중심에 있는 vSensor 제거
  if (result.length > 0) {
    const cx = result.reduce((s, v) => s + v.checkerGrid.pos[0], 0) / result.length;
    const cy = result.reduce((s, v) => s + v.checkerGrid.pos[1], 0) / result.length;
    let centerIdx = 0;
    let minD = Infinity;
    for (let i = 0; i < result.length; i++) {
      const [x, y] = result[i].checkerGrid.pos;
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d < minD) {
        minD = d;
        centerIdx = i;
      }
    }
    result.splice(centerIdx, 1);
  }

  return result;
}

export function snapToSensor(p: p5, src: VSensor[]): VSensor {
  let closest: VSensor = {
    checkerGrid: { grid: { ri: 0, ci: 0 }, pos: [0, 0] },
    near: [],
    clickCount: 0,
    connect: { p1: [0, 0], p2: [0, 0], path: [], t: 0, shrinking: false },
    tentacles: [],
    strength: 0,
    currentStage: 0,
  };
  let minDist: number = Infinity;
  for (const c of src) {
    const [x, y] = c.checkerGrid.pos;
    const d = p.dist(p.mouseX, p.mouseY, x, y);
    if (d < minDist) {
      minDist = d;
      closest = c;
    }
  }
  return closest;
}

//순비 이미지 그리기
export function updateVsensorImage(vSensor: VSensor[]) {
  const near: VsensorImagePos[] = [];
  if (vSensorUnits.length === 0) return near;

  for (const v of vSensor) {
    const [x, y] = v.checkerGrid.pos;
    if (v.strength <= 0) continue;

    const stage = Math.min(Math.floor(v.strength / 100), STEP_OFFSETS.length);
    if (stage === 0) continue;
    if (stage !== v.currentStage) {
      updateHistoryArr(stage);
      v.currentStage = stage;
    }
    for (let s = 0; s < stage; s++) {
      const image = vSensorUnits[s % vSensorUnits.length];
      if (!image) continue;
      const allPos: [number, number][] = [];
      for (let p = 0; p <= s; p++) {
        //단계별 위치 추가
        for (const [dx, dy] of STEP_OFFSETS[p]) {
          allPos.push([x + dx * GRID, y + dy * GRID]);
        }
      }
      near.push({ pos: allPos, image, stage: s });
    }
  }
  return near;
}

export function path2AndFilter(checker: CheckerGrid[], from: [number, number], to: [number, number]) {
  const path = findPath(checker, from, to);

  let filt: CheckerGrid[] = checker.filter(
    (check) =>
      //path1의 xy랑 checker의 위치가 다르면 포함
      !path.some(([x, y]) => check.pos[0] === x && check.pos[1] === y) ||
      //시작점과 끝점이면 포함
      (check.pos[0] === from[0] && check.pos[1] === from[1]) ||
      (check.pos[0] === to[0] && check.pos[1] === to[1])
  );
  filt = filt.filter(() => Math.random() > 0.35);

  return findPath(filt, from, to);
}

export function updateConnection(v: VSensor, vSensor: VSensor[], fg: CheckerGrid[]) {
  if (v.strength <= 0) return;

  // 근처 vSensor 중 하나 찾아서 연결
  const threshold = GRID * 30;
  const candidates: VSensor[] = [];
  for (const other of vSensor) {
    if (other === v) continue;
    if (other.strength < 10) continue;
    const d = Math.hypot(v.checkerGrid.pos[0] - other.checkerGrid.pos[0], v.checkerGrid.pos[1] - other.checkerGrid.pos[1]);
    if (d < threshold) candidates.push(other);
  }
  if (candidates.length === 0) return;

  const other = candidates[Math.floor(Math.random() * candidates.length)];
  const from: [number, number] = [v.checkerGrid.pos[0], v.checkerGrid.pos[1]];
  const to: [number, number] = [other.checkerGrid.pos[0], other.checkerGrid.pos[1]];
  v.connect = { p1: from, p2: to, path: path2AndFilter(fg, from, to), t: 0, shrinking: false };
}

export function updateCurrentTrail(vSensor: VSensor[]): [number[], number] {
  const segFlat: number[] = [];
  let activeCount = 0;

  for (const v of vSensor) {
    const path = v.connect.path;
    if (path.length === 0) continue;

    for (let i = 0; i < path.length - 1; i++) {
      if (segFlat.length >= 400) break;
      segFlat.push(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
    }

    const maxT = path.length * TIME;
    if (v.connect.t < maxT) v.connect.t += TIME * TRAIL_SPEED;

    // count는 진행도만큼만 — 셰이더는 이만큼 그림
    const drawCount = Math.floor(v.connect.t / TIME);
    const cur = Math.max(0, Math.min(drawCount, path.length - 1));
    activeCount += cur;
  }

  while (segFlat.length < 400) segFlat.push(0);
  return [segFlat, activeCount];
}

export function vSensorAlert(x: number, y: number, vSensor: VSensor[], fg: CheckerGrid[]) {
  const v = vSensor.find((a) => a.checkerGrid.pos[0] === x && a.checkerGrid.pos[1] == y);
  if (v) updateConnection(v, vSensor, fg);
}
