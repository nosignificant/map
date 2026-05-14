import p5 from "p5";
import { Tentacle, VSensor, CheckerGrid } from "../Util/types";
import { computePos4Shader } from "../Util/shaderUtil";
import { snapToCheck } from "./checkerboard";
import { GRID } from "../Util/constant";

export function initTentacle(vSensor: VSensor, count: number, length: number, partCount: number): Tentacle[] {
  const tens: Tentacle[] = [];
  const rotAngle = 360 / count;

  for (let i = 0; i < count; i++) {
    // 기본 각도
    const angle = (rotAngle * i * Math.PI) / 180;
    const startPos = vSensor.checkerGrid.pos;
    const defaultPos: [number, number] = [startPos[0] + Math.cos(angle) * length, startPos[1] + Math.sin(angle) * length];

    const parts: [number, number][] = [];
    for (let j = 0; j < partCount; j++) {
      const t = j / (partCount - 1);
      parts.push([startPos[0] + (defaultPos[0] - startPos[0]) * t, startPos[1] + (defaultPos[1] - startPos[1]) * t]);
    }

    const ten: Tentacle = {
      startPos,
      defaultLength: length,
      defaultPos,
      parts,
      target: null,
      t: 0,
      angle: angle,
      isFollowing: false,
      speed: Math.random() * 0.04 + 0.02,
      phase: Math.random() * Math.PI * 2,
      // -30 ~ 30 정도, 음수/양수면 휘는 방향 다름
      curveBias: (Math.random() - 0.5) * 60,
    };
    tens.push(ten);
  }
  return tens;
}

//target이 있을 때 할 행동
export function FABRIK(p: p5, t: Tentacle): [number, number][] {
  if (t.target == null) return [];
  const startToTarget = p.dist(t.startPos[0], t.startPos[1], t.target[0], t.target[1]);
  const offset = startToTarget / (t.parts.length - 1);

  // 길이 유지하면서 새 배열
  const newParts: [number, number][] = t.parts.map((q) => [q[0], q[1]]);

  // 각 파트마다 위상 다르게 좌우(수직 방향)로 흔들기
  const perp: [number, number] = [-Math.sin(t.angle), Math.cos(t.angle)]; // angle 방향에 수직
  const amp = 5; // 흔들림 크기

  // 끝점은 타겟으로 고정
  newParts[newParts.length - 1] = [t.target[0], t.target[1]];

  // 끝에서 시작 쪽으로 (parts[0]은 startPos니까 1까지만)
  for (let i = newParts.length - 2; i >= 1; i--) {
    const cur = new p5.Vector(newParts[i][0], newParts[i][1]);
    const low = new p5.Vector(newParts[i + 1][0], newParts[i + 1][1]);
    const start = new p5.Vector(t.startPos[0], t.startPos[1]);
    const target = new p5.Vector(t.target[0], t.target[1]);

    const startToTargetDir = p5.Vector.sub(start, target).normalize();
    const dir = p5.Vector.sub(cur, low).normalize();
    const finalDir = p5.Vector.lerp(dir, startToTargetDir, 0.5).normalize();
    const finalPos = p5.Vector.add(low, p5.Vector.mult(finalDir, offset));

    const phase = p.frameCount * t.speed + t.phase - i * 0.5; // i가 클수록 위상이 늦어짐
    const off = Math.sin(phase) * amp * (i / newParts.length); // 끝쪽일수록 더 크게
    newParts[i] = [finalPos.x + perp[0] * off, finalPos.y + perp[1] * off];
  }

  // 시작점 고정
  newParts[0] = [t.startPos[0], t.startPos[1]];

  // 정적 curve offset (sin curve, 가운데에서 max로 휨)
  // start와 target은 그대로 두고 중간 파츠만 perp 방향으로 밀어냄
  for (let i = 1; i < newParts.length - 1; i++) {
    const ratio = i / (newParts.length - 1);
    const curveOffset = Math.sin(ratio * Math.PI) * t.curveBias;
    newParts[i] = [newParts[i][0] + perp[0] * curveOffset, newParts[i][1] + perp[1] * curveOffset];
  }

  return newParts;
}

// target == null 일때 할 행동
export function FABRIKswimm(p: p5, t: Tentacle): [number, number][] {
  if (t.target != null) return [];
  const swingAngle = t.angle + Math.sin(p.frameCount * t.speed + t.phase) * 0.3;
  const swingTarget: [number, number] = [
    t.startPos[0] + Math.cos(swingAngle) * t.defaultLength,
    t.startPos[1] + Math.sin(swingAngle) * t.defaultLength,
  ];
  const original = t.target;
  t.target = swingTarget;
  const body = FABRIK(p, t);
  t.target = original;

  return body;
}

export function FABRIKsetTarget(vSensor: VSensor) {
  if (vSensor.connect == null) {
    vSensor.tenTarget = null;
    for (const t of vSensor.tentacles) {
    }
  }
}

export function drawFABRIK(p: p5, t: Tentacle, time: number, endPoint?: [number, number]) {
  t.t += time;
  const newParts = t.target != null ? FABRIK(p, t) : FABRIKswimm(p, t);
  if (newParts.length > 0) t.parts = newParts;

  // endPoint를 향하고 있으면 다른 색/두께
  const isTargetingEndPoint = t.target && endPoint && t.target[0] === endPoint[0] && t.target[1] === endPoint[1];
  const lineColor: [number, number, number] = isTargetingEndPoint ? [255, 100, 100] : [100, 100, 100];
  const lineWeight = isTargetingEndPoint ? 2.5 : 1.5;
  const pointSize = isTargetingEndPoint ? 4 : 3;

  // 촉수 선 그리기
  p.strokeWeight(lineWeight);
  p.stroke(...lineColor);
  for (let i = 0; i < t.parts.length - 1; i++) {
    const [x1, y1] = computePos4Shader(t.parts[i]);
    const [x2, y2] = computePos4Shader(t.parts[i + 1]);
    //p.line(x1, y1, x2, y2);
  }

  // 촉수 점들
  p.fill(...lineColor);
  for (const b of t.parts) {
    const [x, y] = computePos4Shader(b);
    p.circle(x, y, pointSize);
  }
}

export function drawOccupiedMeta(p: p5, occupied: [number, number][]) {
  if (occupied.length === 0) return;

  const radius = GRID * 5;
  const threshold = 1.0;
  const res = GRID / 2;

  // 각 점에서 metaball 필드값: 가까울수록 값이 커짐
  function field(x: number, y: number): number {
    let sum = 0;
    for (const [ox, oy] of occupied) {
      const d = Math.hypot(x - ox, y - oy);
      if (d < 0.001) return 999;
      sum += (radius * radius) / (d * d);
    }
    return sum;
  }

  // 두 점 사이에서 threshold를 넘는 정확한 위치 선형보간
  function isoPoint(x0: number, y0: number, v0: number, x1: number, y1: number, v1: number): [number, number] {
    const t = (threshold - v0) / (v1 - v0);
    return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
  }

  // 바운딩 박스
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const [x, y] of occupied) {
    minX = Math.min(minX, x - radius * 2);
    maxX = Math.max(maxX, x + radius * 2);
    minY = Math.min(minY, y - radius * 2);
    maxY = Math.max(maxY, y + radius * 2);
  }

  p.push();
  p.noFill();
  p.stroke(150);
  p.strokeWeight(1.5);

  for (let x = minX; x < maxX; x += res) {
    for (let y = minY; y < maxY; y += res) {
      const x1 = x + res;
      const y1 = y + res;

      // 4개 꼭짓점 필드값 (TL, TR, BR, BL)
      const f00 = field(x, y); // TL
      const f10 = field(x1, y); // TR
      const f11 = field(x1, y1); // BR
      const f01 = field(x, y1); // BL

      // 각 꼭짓점이 threshold 넘으면 비트 세팅
      const c = (f00 > threshold ? 8 : 0) | (f10 > threshold ? 4 : 0) | (f11 > threshold ? 2 : 0) | (f01 > threshold ? 1 : 0);

      if (c === 0 || c === 15) continue;

      // 각 변의 교점 (lazy 계산)
      const top = () => isoPoint(x, y, f00, x1, y, f10);
      const right = () => isoPoint(x1, y, f10, x1, y1, f11);
      const bottom = () => isoPoint(x, y1, f01, x1, y1, f11);
      const left = () => isoPoint(x, y, f00, x, y1, f01);

      const seg = (a: [number, number], b: [number, number]) => {
        const [ax, ay] = computePos4Shader(a);
        const [bx, by] = computePos4Shader(b);
        p.line(ax, ay, bx, by);
      };

      // Marching Squares 16가지 케이스
      switch (c) {
        case 1:
          seg(left(), bottom());
          break;
        case 2:
          seg(bottom(), right());
          break;
        case 3:
          seg(left(), right());
          break;
        case 4:
          seg(top(), right());
          break;
        case 5:
          seg(top(), left());
          seg(bottom(), right());
          break;
        case 6:
          seg(top(), bottom());
          break;
        case 7:
          seg(top(), left());
          break;
        case 8:
          seg(top(), left());
          break;
        case 9:
          seg(top(), bottom());
          break;
        case 10:
          seg(top(), right());
          seg(left(), bottom());
          break;
        case 11:
          seg(top(), right());
          break;
        case 12:
          seg(left(), right());
          break;
        case 13:
          seg(bottom(), right());
          break;
        case 14:
          seg(left(), bottom());
          break;
      }
    }
  }
  p.pop();
}

export function drawOccupied(p: p5, occupied: [number, number][]) {
  const occupiedSet = new Set(occupied.map(([x, y]) => `${x},${y}`));

  p.stroke(150);
  p.strokeWeight(1);

  for (const [x, y] of occupied) {
    const [px, py] = computePos4Shader([x, y]);
    const l = px - GRID / 2;
    const t = py - GRID / 2;
    const r = px + GRID / 2;
    const b = py + GRID / 2;

    const hasTop = occupiedSet.has(`${x},${y - GRID}`);
    const hasBottom = occupiedSet.has(`${x},${y + GRID}`);
    const hasLeft = occupiedSet.has(`${x - GRID},${y}`);
    const hasRight = occupiedSet.has(`${x + GRID},${y}`);

    if (!hasTop) p.line(l, t, r, t);
    if (!hasBottom) p.line(l, b, r, b);
    if (!hasLeft) p.line(l, t, l, b);
    if (!hasRight) p.line(r, t, r, b);
  }
}

export function tenOccupied(fg: CheckerGrid[], vSensor: VSensor[]): [number, number][] {
  const occupied: [number, number][] = [];
  for (const v of vSensor) {
    for (const t of v.tentacles) {
      occupied.push(snapToCheck(t.startPos, fg));
      for (const part of t.parts) {
        occupied.push(snapToCheck(part, fg));
      }
      if (t.target) occupied.push(snapToCheck(t.target, fg));
    }
  }
  return occupied;
}
