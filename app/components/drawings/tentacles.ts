import p5 from "p5";
import { Tentacle, VSensor, CheckerGrid, Vaccumulate, Ssensor, Accumulate, ImgSet } from "../Util/types";
import { snapToCheck } from "./checkerboard";
import { STEP_OFFSETS, GRID, TIME } from "../Util/constant";
import { computePos4Shader } from "../Util/shaderUtil";
import { drawCross } from "./draw";
import { updateConnection } from "../sensors/vSensor";
import { reportVten, reportSten } from "../forPrint";

export function initTentacle(vSensor: VSensor, length: number, partCount: number): Tentacle {
  const angle = 0;
  const startPos = vSensor.checkerGrid.pos;
  const defaultPos: [number, number] = [startPos[0] + Math.cos(angle) * length, startPos[1] + Math.sin(angle) * length];

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
    curveBias: (Math.random() - 0.5) * 60,
  };
}

export function initStentacle(sIMGpos: Ssensor, length: number, partCount: number): Tentacle {
  const angle = 0;
  const startPos = sIMGpos.pos;
  const defaultPos: [number, number] = [startPos[0] + Math.cos(angle) * length, startPos[1] + Math.sin(angle) * length];

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
    curveBias: (Math.random() - 0.5) * 60,
  };
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

export function updateTtentacle(Vacc: Vaccumulate[], acc: Accumulate[], vSensor: VSensor[], fg: CheckerGrid[]) {
  for (const v of vSensor) {
    const t = v.tentacle;
    const [vx, vy] = v.checkerGrid.pos;
    const a = Vacc.find((acc) => acc.pos[0] === vx && acc.pos[1] === vy);

    if (a && a.freq > 0) {
      const isNewStim = a.freq !== (a.lastFreq ?? 0);
      const switchReady = t.switchT <= 0;

      const canUpdate = (isNewStim || switchReady) && !(!isNewStim && t.t <= 0);

      if (canUpdate) {
        const candidates = makePosCandidate(acc, t);
        if (candidates.length === 0) continue;

        const ratio = Math.min(a.freq / 50, 1);
        const other = getCandidate(candidates);
        const [x, y] = getRandomTarget(a, ratio);
        t.target = [other[0] + x * GRID, other[1] + y * GRID];
        reportVten(t.target[0], t.target[1]); // vSensor 촉수 궤적 기록 (상한 15개)

        // 새 자극일 때만 수명 + 전환 간격(고정) 계산
        if (isNewStim) {
          t.t = a.freq > 100 ? a.freq * 100 : a.freq * 10;
          const switchCount = Math.max(1, Math.round(20 * (1 - ratio)));
          t.switchInterval = t.t / switchCount;
        }
        t.switchT = t.switchInterval;

        // target 정한 직후 connection 생성 (최대 3개)
        updateConnection(v, fg);
      }
    }

    // 수명/전환 타이머는 모든 vSensor에서 매 프레임 감소
    t.t -= TIME;
    t.switchT -= TIME;
    if (t.t <= 0) t.target = null;
  }
}

function makePosCandidate(acc: Accumulate[], tentacle: Tentacle): Accumulate[] {
  const candidates: Accumulate[] = [];
  for (const a of acc) {
    const [vx, vy] = a.pos;
    const [tx, ty] = tentacle.startPos;
    const dx = tx - vx;
    const dy = ty - vy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d <= tentacle.defaultLength * 4) candidates.push(a);
  }
  return candidates;
}

function getCandidate(candidates: Accumulate[]): [number, number] {
  for (const c of candidates) {
    if (1 - 1 / c.freq + Math.random() > 0.6) {
      const index = Math.floor(Math.random() * candidates.length);
      return [candidates[index].pos[0], candidates[index].pos[1]];
    }
  }
  return [0, 0];
}

function getRandomTarget(a: Vaccumulate, ratio: number): [number, number] {
  const maxStage = STEP_OFFSETS.length - 1;
  const stage = Math.round(maxStage * (1 - ratio));

  const randPoss = STEP_OFFSETS[stage];
  return randPoss[Math.floor(Math.random() * randPoss.length)];
}

export function syncAccumulateLastFreq(vSensorAccumulate: Vaccumulate[]) {
  for (const a of vSensorAccumulate) {
    a.lastFreq = a.freq;
  }
}

export function updateStentacle(sSensor: Ssensor[], fg: CheckerGrid[]) {
  for (const s of sSensor) {
    for (const t of s.tentacles) {
      t.t -= TIME;
      if (t.t > 0) continue;

      // 근처 fg 후보
      const candidates: CheckerGrid[] = [];
      for (const g of fg) {
        const [gx, gy] = g.pos;
        const [tx, ty] = t.startPos;
        const d = Math.hypot(tx - gx, ty - gy);
        if (d <= t.defaultLength * 1) candidates.push(g);
      }
      if (candidates.length === 0) continue; // 없으면 스킵

      // 랜덤 하나 디디기
      const r = Math.floor(Math.random() * candidates.length);
      t.target = [candidates[r].pos[0], candidates[r].pos[1]];
      reportSten(t.target[0], t.target[1]); // sSensor 발 궤적 기록 (상한 15개)
      t.t = 5;
    }
  }
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

  let lineWeight = 4;
  let currentColor = [85, 150, 188];
  if (acc) {
    lineWeight = 7;
    currentColor = [
      lineColor[0] + (brightColor[0] - lineColor[0]) * prob,
      lineColor[1] + (brightColor[1] - lineColor[1]) * prob,
      lineColor[2] + (brightColor[2] - lineColor[2]) * prob,
      0,
    ];
  }
  p.stroke(currentColor);

  p.strokeWeight(lineWeight);

  for (let i = 0; i < t.parts.length - 1; i++) {
    const [x1, y1] = conv(t.parts[i]);
    const [x2, y2] = conv(t.parts[i + 1]);
    p.line(x1, y1, x2, y2);
  }

  p.fill(currentColor);
  for (const b of t.parts) {
    const [x, y] = conv(b);
    p.strokeWeight(2);
    p.stroke(
      lineColor[0] + (brightColor[0] - lineColor[0]) * prob,
      lineColor[1] + (brightColor[1] - lineColor[1]) * prob,
      lineColor[2] + (brightColor[2] - lineColor[2]) * prob
    );
    if (useShaderPos) drawCross(p, x, y);
  }
}

export function tenOccupied(fg: CheckerGrid[], vSensor: VSensor[]): [number, number][] {
  const occupied: [number, number][] = [];
  for (const v of vSensor) {
    const t = v.tentacle;
    if (t.target == null) continue; // target 없으면 tapestry에 안 그림
    occupied.push(snapToCheck(t.startPos, fg));
    for (const part of t.parts) {
      occupied.push(snapToCheck(part, fg));
    }
    occupied.push(snapToCheck(t.target, fg));
  }
  return occupied;
}

// 촉수 1개 생성 (startPos 기준)
export function makeTentacle(startPos: [number, number], length: number, partCount: number): Tentacle {
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
    curveBias: (Math.random() - 0.5) * 60,
  };
}

//ssensor는
