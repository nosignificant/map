import type p5 from "p5";
import { CheckerGrid, VSensor, VsensorImagePos, Connect } from "../Util/types";
import { GRID, TIME, TRAIL_SPEED, STEP_OFFSETS, CANVAS } from "../Util/constant";
import { findPath } from "../Util/BFS";
import { vSensorUnits } from "../Util/imageStore";
import { updateHistoryArr } from "../SketchHistory";
import { computePos4Shader } from "../Util/shaderUtil";
import { colorAt } from "../Arduino";

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
        connect: [],
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
    connect: [],
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
      !path.some(([x, y]) => check.pos[0] === x && check.pos[1] === y) ||
      (check.pos[0] === from[0] && check.pos[1] === from[1]) ||
      (check.pos[0] === to[0] && check.pos[1] === to[1])
  );
  filt = filt.filter(() => Math.random() > 0.35);

  return findPath(filt, from, to);
}

let altToggle = false;

export function updateConnection(v: VSensor, vSensor: VSensor[], fg: CheckerGrid[]) {
  if (v.strength <= 0) return;

  const threshold = GRID * 15;
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
  v.connect.push({ path: path2AndFilter(fg, from, to), t: 0, alt: altToggle });
  altToggle = !altToggle;
}

export function drawConnection(p: p5, vSensor: VSensor[]) {
  for (const v of vSensor) {
    for (let i = v.connect.length - 1; i >= 0; i--) {
      const c = v.connect[i];
      if (c.path.length === 0) {
        v.connect.splice(i, 1);
        continue;
      }

      c.t += TIME * TRAIL_SPEED;
      const maxT = c.path.length * TIME;

      if (c.t >= maxT + TIME * 500) {
        v.connect.splice(i, 1);
        continue;
      }

      const drawCount = Math.floor(c.t / TIME);
      const cur = Math.max(0, Math.min(drawCount, c.path.length - 1));
      p.strokeCap(p.SQUARE);

      const currentPathOcc = c.path.slice(0, cur + 1);
      const [hx, hy] = c.path[cur];
      drawUpAndDown(p, hx, hy, currentPathOcc, c.alt);

      p.stroke(0);
      p.strokeWeight(GRID);
      for (let j = 0; j < cur; j++) {
        const [x1, y1] = computePos4Shader(c.path[j]);
        const [x2, y2] = computePos4Shader(c.path[j + 1]);
        p.line(x1, y1, x2, y2);
      }
    }
  }
}

export function drawUpAndDown(p: p5, hx: number, hy: number, currentPathOcc: [number, number][], alt: boolean) {
  const half = CANVAS / 2;
  p.strokeWeight(GRID - 5);

  const horizColor: [number, number, number] = alt ? [0, 0, 255] : [255, 0, 0];
  const vertColor: [number, number, number] = alt ? [255, 0, 0] : [0, 0, 255];

  for (const pos of currentPathOcc) {
    const [rawX, rawY] = pos;
    if (rawX === hx && rawY === hy) continue;

    const [px, py] = computePos4Shader([rawX, rawY]);

    p.stroke(...horizColor);
    if (px < 0) {
      p.rect(-half, py - GRID / 2, px + half, GRID);
    } else {
      p.rect(px, py - GRID / 2, half - px, GRID);
    }

    p.stroke(...vertColor);
    if (py < 0) {
      p.rect(px - GRID / 2, -half, GRID, py + half);
    } else {
      p.rect(px - GRID / 2, py, GRID, half - py);
    }
  }
}

export function vSensorAlert(x: number, y: number, vSensor: VSensor[], fg: CheckerGrid[]) {
  const v = vSensor.find((a) => a.checkerGrid.pos[0] === x && a.checkerGrid.pos[1] == y);
  if (v) updateConnection(v, vSensor, fg);
}
