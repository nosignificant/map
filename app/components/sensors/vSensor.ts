import type p5 from "p5";
import { CheckerGrid, VSensor, CheckerDistStep, Connect } from "../Util/types";
import { GRID } from "../Util/constant";
import { drawCircleCross, drawTwoCircle } from "../drawings/drawings";
import { findPath } from "../Util/BFS";

export function initVSensor(checker: CheckerGrid[]): VSensor[] {
  const result: VSensor[] = [];
  const rows: { y: number; ri: number }[] = [];
  const cols: { x: number; ci: number }[] = [];

  for (let i = 3; i <= 15; i += 3) {
    const row = checker.find((c) => c.grid.ri === i);
    const col = checker.find((c) => c.grid.ci === i);
    if (row) rows.push({ y: row.pos[1], ri: row.grid.ri });
    if (col) cols.push({ x: col.pos[0], ci: col.grid.ci });
  }

  for (const col of cols) {
    for (const row of rows) {
      result.push({ checkerGrid: { grid: { ri: row.ri, ci: col.ci }, pos: [col.x, row.y] }, near: [], clickCount: 0, t: 60, connect: [] });
    }
  }
  return result;
}

//update//
//update//
//update//
export function updateVSensor(p: p5, src: VSensor[], checker: CheckerGrid[], t: number) {
  for (const c of src) {
    if (c.clickCount > 0) {
      for (const n of c.near) {
        if (n.distStep === 1) drawCircleCross(p, n.checkerGrid.pos[0], n.checkerGrid.pos[1]);
        if (c.clickCount >= 2 && n.distStep === 2) drawTwoCircle(p, n.checkerGrid.pos[0], n.checkerGrid.pos[1], GRID);
        drawConnections(p, c.connect, checker);
      }
      c.t -= t;
      c.clickCount = Math.floor(c.t / 60) + 1;
    }
  }
}

export function snapToSensor(p: p5, src: VSensor[]): VSensor {
  let closest: VSensor = { checkerGrid: { grid: { ri: 0, ci: 0 }, pos: [0, 0] }, near: [], clickCount: 0, t: 0, connect: [] };
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

export function findNearCheck(p: p5, point: VSensor, src: CheckerGrid[]): CheckerDistStep[] {
  const near: CheckerDistStep[] = [];
  for (const c of src) {
    const [x, y] = c.pos;
    const d = p.dist(point.checkerGrid.pos[0], point.checkerGrid.pos[1], x, y);
    if (d <= GRID) near.push({ checkerGrid: c, distStep: 1 });
    if (d > GRID && d <= GRID * 3) near.push({ checkerGrid: c, distStep: 2 });
  }
  return near;
}

export function vSensored(p: p5, src: VSensor[]) {
  if (!src || src.length === 0) return;

  for (const c of src) {
    const [x, y] = [c.checkerGrid.pos[0], c.checkerGrid.pos[1]];

    if (c.clickCount > 0) {
      p.circle(x, y, GRID + c.t * 2);
    }
  }
}

export function findOtherSensor(p: p5, me: VSensor, src: VSensor[]): Connect[] {
  const connect: Connect[] = [];
  const threshold = GRID * 10;
  for (const other of src) {
    if (me === other) continue;
    const d = p.dist(me.checkerGrid.pos[0], me.checkerGrid.pos[1], other.checkerGrid.pos[0], other.checkerGrid.pos[1]);
    const prob = Math.max(0, 1 - d / threshold) ** 0.5;

    //멀리 있는 다른 진동 센서 선택
    const wantConnectSensor = Math.random() < prob;
    if (wantConnectSensor) {
      //다른 진동센서의 반경 안에 연결될 위치 선택
      for (const n of me.near) {
        for (const otherN of other.near) {
          if (n.distStep !== me.clickCount) continue;
          if (otherN.distStep !== other.clickCount) continue;
          const [x, y] = n.checkerGrid.pos;
          const [ox, oy] = otherN.checkerGrid.pos;
          const d = p.dist(x, y, ox, oy);
          const prob = Math.max(0, 1 - d / threshold) ** 5;
          const wantConnectCheck = Math.random() < prob;
          if (wantConnectCheck) connect.push({ p1: [x, y], p2: [ox, oy] });
        }
      }
    }
  }
  return connect;
}

export function drawConnections(p: p5, src: Connect[], checker: CheckerGrid[]) {
  p.strokeWeight(10);
  p.stroke(0, 0, 255);

  for (const c of src) {
    const path = findPath(checker, c.p1, c.p2);
    for (let i = 0; i < path.length - 1; i++) {
      const [x1, y1] = path[i];
      const [x2, y2] = path[i + 1];
      p.line(x1, y1, x2, y2);
    }
  }
}
