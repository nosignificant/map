import p5 from "p5";
import { Tentacle, VSensor, CheckerGrid } from "../Util/types";
import { computePos4Shader } from "../Util/shaderUtil";
import { snapToCheck } from "./checkerboard";

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
  const lineColor = isTargetingEndPoint ? [255, 100, 100] : [100, 100, 100]; // 빨간색 vs 회색
  const lineWeight = isTargetingEndPoint ? 2.5 : 1.5;
  const pointSize = isTargetingEndPoint ? 4 : 3;

  // 촉수 선 그리기
  p.strokeWeight(lineWeight);
  p.stroke(...lineColor);
  for (let i = 0; i < t.parts.length - 1; i++) {
    const [x1, y1] = computePos4Shader(t.parts[i]);
    const [x2, y2] = computePos4Shader(t.parts[i + 1]);
    p.line(x1, y1, x2, y2);
  }

  // 촉수 점들
  p.fill(...lineColor);
  for (const b of t.parts) {
    const [x, y] = computePos4Shader(b);
    p.circle(x, y, pointSize);
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
