import p5 from "p5";
import { Tentacle, VSensor } from "../Util/types";
import { computePos4Shader } from "../Util/shaderUtil";

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

    const phase = p.frameCount * 0.1 - i * 0.5; // i가 클수록 위상이 늦어짐
    const off = Math.sin(phase) * amp * (i / newParts.length); // 끝쪽일수록 더 크게
    newParts[i] = [finalPos.x + perp[0] * off, finalPos.y + perp[1] * off];
  }

  // 시작점 고정
  newParts[0] = [t.startPos[0], t.startPos[1]];

  return newParts;
}

// target == null 일때 할 행동
export function FABRIKswimm(p: p5, t: Tentacle): [number, number][] {
  if (t.target != null) return [];
  const swingTarget: [number, number] = [t.startPos[0] + Math.cos(t.angle) * t.defaultLength, t.startPos[1] + Math.sin(t.angle) * t.defaultLength];
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

export function drawFABRIK(p: p5, t: Tentacle, time: number) {
  t.t += time;
  const newParts = t.target != null ? FABRIK(p, t) : FABRIKswimm(p, t);
  if (newParts.length > 0) t.parts = newParts;
  for (const b of t.parts) {
    const [x, y] = computePos4Shader(b);
    p.circle(x, y, 5);
  }
}
