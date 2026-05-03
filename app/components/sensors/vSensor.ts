import type p5 from "p5";
import { CheckerGrid, VSensor, CheckerDistStep, Connect, Frequency } from "../Util/types";
import { GRID, TIME, SPEED } from "../Util/constant";
import { drawCircleCross } from "../drawings/drawings";
import { findPath } from "../Util/BFS";

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
        t: 60,
        connect: [],
        tentacles: [],
        tenTarget: null,
      });
    }
  }
  return result;
}

//update//
//update//
//update//
export function updateVSensor(p: p5, vSensors: VSensor[], checker: CheckerGrid[], time: number) {
  for (const v of vSensors) {
    if (v.clickCount > 0) {
      //for (const n of c.near) {
      //if (n.distStep === 1) drawCircleCross(p, n.checkerGrid.pos[0], n.checkerGrid.pos[1], GRID);
      //if (c.clickCount >= 2 && n.distStep === 2) drawTwoCircle(p, n.checkerGrid.pos[0], n.checkerGrid.pos[1], GRID);
      //}
      v.t -= time;
      //현재 클릭카운트보다 원 반경 / grid(clickCount)가 작아지면
      //시작하고 바로나서는 grid * clickcount - time 상태니까 바로 0이됨
      if (v.t / GRID <= v.clickCount - 1) {
        if (v.t <= 0) {
          v.clickCount--;
        }
      }
    }
  }
}

export function snapToSensor(p: p5, src: VSensor[]): VSensor {
  let closest: VSensor = {
    checkerGrid: { grid: { ri: 0, ci: 0 }, pos: [0, 0] },
    near: [],
    clickCount: 0,
    t: 0,
    connect: [],
    tentacles: [],
    tenTarget: null,
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

export function findOtherSensor(p: p5, me: VSensor, src: VSensor[], checker: CheckerGrid[]): Connect[] {
  const connect: Connect[] = [];
  const threshold = GRID * 30;
  for (const other of src) {
    if (me === other) continue;
    const d = p.dist(me.checkerGrid.pos[0], me.checkerGrid.pos[1], other.checkerGrid.pos[0], other.checkerGrid.pos[1]);
    const prob = Math.max(0, 1 - d / threshold) ** 0.1;

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
          const prob = Math.max(0, 1 - d / threshold) ** 8;
          const wantConnectCheck = Math.random() < prob;
          if (wantConnectCheck) {
            const contained = connect.find((c) => c.p1[0] === x && c.p1[1] === y);
            if (contained) continue;
            connect.push({ p1: [x, y], p2: [ox, oy], path: path2AndFilter(checker, [x, y], [ox, oy]), t: 0, shrinking: false });
          }
        }
      }
    }
  }
  return connect;
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

export function drawConnections(p: p5, src: Connect[], checker: CheckerGrid[]) {
  p.stroke(0, 0, 255);

  for (const c of src) {
    if (c.path.length === 0) continue;
    //최대 시간
    const maxT = c.path.length * TIME;

    //줄어들고 있는 때가 아니었고 connect의 t가 max + cooldown 지나면
    if (!c.shrinking && c.t >= maxT + TIME * 5) c.shrinking = true;
    c.t += c.shrinking ? -TIME : TIME;

    //line setting
    const d = Math.hypot(c.p2[0] - c.p1[0], c.p2[1] - c.p1[1]);
    const maxWeight = 10;
    p.strokeWeight(Math.max(1, maxWeight - Math.floor(d / 50)));

    //프레임마다 time을 쁠마하고있으니까 t / time하면 몇번째인지 나옴
    const drawCount = Math.floor(c.t / TIME);

    //뒤에서부터 그림
    if (c.shrinking) {
      const currentIndex = Math.max(0, c.path.length - 1 - drawCount);
      for (let i = currentIndex; i < c.path.length - 1; i++) {
        const [x1, y1] = c.path[i];
        const [x2, y2] = c.path[i + 1];
        p.line(x1, y1, x2, y2);
      }
    } else {
      // 앞에서부터 그림
      const currentIndex = Math.min(drawCount, c.path.length - 1);
      for (let i = 0; i < currentIndex; i++) {
        const [x1, y1] = c.path[i];
        const [x2, y2] = c.path[i + 1];
        p.line(x1, y1, x2, y2);
      }
    }

    const [sx, sy] = c.path[0];
    const [ex, ey] = c.path[c.path.length - 1];
    drawCircleCross(p, sx, sy, GRID / 2);
    drawCircleCross(p, ex, ey, GRID / 2);
  }
}

export function updateConnection(vSensor: VSensor[], fg?: CheckerGrid[]): [number[], [number, number]] {
  const segFlat: number[] = [];
  let endPoint: [number, number] = [0, 0];

  // 반경 내 fg 격자점 중 랜덤 선택 (target 없을 때 사용)
  function findRandomFgPoint(me: VSensor): [number, number] | null {
    if (!fg || fg.length === 0) return null;
    const threshold = GRID * 8; // 8칸 이내
    const candidates: [number, number][] = [];
    for (const f of fg) {
      const d = Math.hypot(me.checkerGrid.pos[0] - f.pos[0], me.checkerGrid.pos[1] - f.pos[1]);
      if (d > GRID && d < threshold) candidates.push(f.pos);
    }
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  for (const v of vSensor) {
    let vEnd: [number, number] | null = null;
    for (const c of v.connect) {
      if (c.path.length === 0) continue;

      const maxT = c.path.length * TIME;
      const waitForShrink = TIME * 5;
      //쿨다운 + 최대 시간이 지나면 축소됨으로 변경
      if (!c.shrinking && c.t >= maxT + waitForShrink) c.shrinking = true;
      c.t += (c.shrinking ? -TIME : TIME) * SPEED;

      const drawCount = Math.floor(c.t / TIME);

      if (c.shrinking) {
        // 현재 인덱스
        const cur = Math.min(drawCount, c.path.length - 1);
        for (let i = 0; i < cur; i++) {
          if (segFlat.length >= 400) break;
          segFlat.push(c.path[i][0], c.path[i][1], c.path[i + 1][0], c.path[i + 1][1]);
        }
        if (cur > 0) {
          const ep: [number, number] = [c.path[cur][0], c.path[cur][1]];
          vEnd = ep;
          endPoint = ep;
        }
      } else {
        const cur = Math.max(0, c.path.length - 1 - drawCount);
        for (let i = cur; i < c.path.length - 1; i++) {
          if (segFlat.length >= 400) break;
          segFlat.push(c.path[i][0], c.path[i][1], c.path[i + 1][0], c.path[i + 1][1]);
        }
        if (cur < c.path.length) {
          const ep: [number, number] = [c.path[cur][0], c.path[cur][1]];
          vEnd = ep;
          endPoint = ep;
        }
      }
    }

    // 이 vSensor의 tentacle들에 target 세팅
    // vEnd 없으면 각 tentacle마다 다른 fg 격자점 선택
    for (const t of v.tentacles) {
      if (vEnd) {
        t.target = [vEnd[0], vEnd[1]];
      } else {
        // target이 이미 있으면 유지, 없거나 가끔 새로 선택
        const needNewTarget = !t.target || Math.random() < 0.005; // 0.5% 확률로 변경
        if (needNewTarget) {
          const fgPoint = findRandomFgPoint(v);
          t.target = fgPoint ? [fgPoint[0], fgPoint[1]] : null;
        }
      }
    }
  }
  while (segFlat.length < 400) segFlat.push(0);

  return [segFlat, endPoint];
}

export function updateFreq(freq: Frequency[], t: number) {
  for (let i = freq.length - 1; i >= 0; i--) {
    freq[i].t -= t;
    if (freq[i].t <= 0) freq.splice(i, 1);
  }
}
