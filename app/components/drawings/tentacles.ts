import p5 from "p5";
import { Tentacle, VSensor, CheckerGrid, Vaccumulate } from "../Util/types";
import { snapToCheck } from "./checkerboard";
import { computePos4Shader } from "../Util/shaderUtil";
import { drawCross } from "./draw";
import { vSensorUnits } from "../Util/imageStore";

const UNIT_SIZE = 50; // 촉수 뼈에 그리는 vUnit 이미지 크기

// ===== 공통 촉수 탐색 알고리즘 =====
// candidate는 호출자가 자기 좌표계로 만들어 넘김 (vTentacle=top-left, sTentacle=center)
// 타이머(t.t) 동안 interval마다 하나 짚고, isSensor 짚으면 고정, 시간 끝나면 소멸
export type TenCandidate = { pos: [number, number]; isSensor: boolean; isSonar?: boolean };

export function searchTentacle(
  t: Tentacle,
  interval: number,
  buildCandidates: () => TenCandidate[],
  report?: (pos: [number, number]) => void
) {
  if (t.locked) return; // 이미 센서 찾음 → target 고정
  t.t -= 1;
  if (t.t <= 0) {
    t.target = null; // 탐색 시간 끝 → 소멸
    return;
  }
  t.switchT -= 1;
  if (t.switchT > 0) return; // 다음 간격 아직
  t.switchT = interval;

  const cands = buildCandidates();
  if (cands.length === 0) return;

  const pick = cands[Math.floor(Math.random() * cands.length)];
  t.target = pick.pos;
  report?.(pick.pos);
  if (pick.isSensor) {
    t.locked = true; // 센서 찾으면 고정
    t.lockedSonar = !!pick.isSonar; // 다른 sonar면 표시
  }
}

export function FABRIK(p: p5, t: Tentacle): [number, number][] {
  if (t.target == null) return [];
  const startToTarget = p.dist(t.startPos[0], t.startPos[1], t.target[0], t.target[1]);
  const offset = startToTarget / (t.parts.length - 1);

  // 길이 유지하면서 새 배열
  const newParts: [number, number][] = t.parts.map((q) => [q[0], q[1]]);

  // start → target 방향 각도 (라디안)
  const angle = Math.atan2(t.target[1] - t.startPos[1], t.target[0] - t.startPos[0]);
  // 각 파트마다 위상 다르게 좌우(수직 방향)로 흔들기
  const perp: [number, number] = [-Math.sin(angle), Math.cos(angle)]; // angle 방향에 수직
  const amp = 5; // 흔들림 크기

  // 끝점은 타겟으로 고정
  newParts[newParts.length - 1] = [t.target[0], t.target[1]];

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

export function sTentacleAlert(pos: [number, number], tentacles: Tentacle[]) {
  for (const t of tentacles) t.startPos = [pos[0], pos[1]];
}
export function drawFABRIK(p: p5, t: Tentacle, acc?: Vaccumulate, useShaderPos = true) {
  if (t.target == null) return;

  const newParts = FABRIK(p, t);
  if (newParts.length > 0) t.parts = newParts;

  // WEBGL(메인)은 중앙 변환 필요, P2D+translate(sonar)는 원본 그대로
  const conv = (pt: [number, number]): [number, number] => (useShaderPos ? computePos4Shader(pt) : pt);

  const lineColor: [number, number, number] = [0, 0, 255];
  const brightColor: [number, number, number] = [247, 0, 137];

  const freq = acc?.lastFreq ?? acc?.freq ?? 0;
  const prob = Math.min(freq / 50, 1);

  const lineWeight = acc ? 7 : 3;
  // 항상 freq 그라데이션 색 (prob=0이면 lineColor)
  const currentColor = [
    lineColor[0] + (brightColor[0] - lineColor[0]) * prob,
    lineColor[1] + (brightColor[1] - lineColor[1]) * prob,
    lineColor[2] + (brightColor[2] - lineColor[2]) * prob,
  ];
  p.stroke(currentColor);

  p.strokeWeight(lineWeight);

  for (let i = 0; i < t.parts.length - 1; i++) {
    const [x1, y1] = conv(t.parts[i]);
    const [x2, y2] = conv(t.parts[i + 1]);
    p.line(x1, y1, x2, y2);
  }

  // vSensor 촉수(useShaderPos)면 뼈마다 vUnit 이미지, 아니면 십자
  const unitImg = useShaderPos && vSensorUnits.length > 0 ? vSensorUnits[Math.floor((t.phase / (Math.PI * 2)) * vSensorUnits.length) % vSensorUnits.length] : null;

  p.fill(currentColor);
  for (const b of t.parts) {
    const [x, y] = conv(b);
    if (unitImg) {
      p.image(unitImg, x - UNIT_SIZE / 2, y - UNIT_SIZE / 2, UNIT_SIZE, UNIT_SIZE);
    } else if (useShaderPos) {
      p.strokeWeight(2);
      p.stroke(
        lineColor[0] + (brightColor[0] - lineColor[0]) * prob,
        lineColor[1] + (brightColor[1] - lineColor[1]) * prob,
        lineColor[2] + (brightColor[2] - lineColor[2]) * prob
      );
      drawCross(p, x, y);
    }
  }
}

export function makeTentacle(startPos: [number, number], length: number, partCount: number, curvedBias: number): Tentacle {
  const defaultPos: [number, number] = [startPos[0] + length, startPos[1]];
  const parts: [number, number][] = [];
  for (let j = 0; j < partCount; j++) {
    const t = j / (partCount - 1);
    parts.push([startPos[0] + (defaultPos[0] - startPos[0]) * t, startPos[1] + (defaultPos[1] - startPos[1]) * t]);
  }
  return {
    startPos,
    defaultLength: length,
    defaultPos,
    parts,
    target: null,
    t: 0,
    switchT: 0,
    switchInterval: 0,
    speed: Math.random() * 0.04 + 0.02,
    phase: Math.random() * Math.PI * 2,
    curveBias: (Math.random() - 0.5) * curvedBias,
    locked: false,
    lockedSonar: false,
  };
}

//ssensor는
