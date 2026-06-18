import { CheckerGrid, VSensor, VsensorImagePos, Vaccumulate } from "../Util/types";
import { GRID, STEP_OFFSETS } from "../Util/constant";
import { vSensorUnits2 } from "../Util/imageStore";
import { updateHistoryArr } from "../SketchHistory";
import vSensorPositions from "../Util/vSensorPositions.json";

const V_DECAY = 2; // 매 프레임 v.t 감소 (작을수록 오래 유지)
const STAGE_DIV = 50; // stage 1당 필요한 v.t

// piezo 번호 = 배열 인덱스. 이름·좌표는 vSensorPositions.json에서 정의
export function initVSensor(_checker: CheckerGrid[]): VSensor[] {
  return (vSensorPositions as { name: string; pos: [number, number] }[]).map(({ name, pos }) => ({
    name,
    checkerGrid: { grid: { ri: (pos[1] - GRID) / GRID, ci: (pos[0] - GRID) / GRID }, pos: [pos[0], pos[1]] as [number, number] },
    near: [],
    clickCount: 0,
    connect: [],
    strength: 0,
    currentStage: 0,
    t: 0,
  }));
}

// 진동 신호 → strength 갱신 (현재 잔량보다 강할 때만). stage 수명(t) 설정
export function applyStrength(v: VSensor, strength: number) {
  if (strength <= v.t) return;
  v.strength = strength;
  v.t = strength;
}

// 매 프레임: v.t 감소 → currentStage 갱신 (시간 지나며 반경 축소)
export function updateVsensor(vSensor: VSensor[]) {
  for (const v of vSensor) {
    if (v.t <= 0) continue;
    v.t -= V_DECAY;
    const stage = Math.min(Math.floor(v.t / STAGE_DIV), STEP_OFFSETS.length);
    if (stage > v.currentStage) updateHistoryArr(stage);
    v.currentStage = stage;
  }
}

export function syncAccumulateLastFreq(vSensorAccumulate: Vaccumulate[]) {
  for (const a of vSensorAccumulate) a.lastFreq = a.freq;
}

// vSensor 단계별 이미지 (units-3pt-yl). 각 단계 이미지를 누적 위치에 겹쳐 그림
export function updateVsensorImage(vSensor: VSensor[]) {
  const near: VsensorImagePos[] = [];
  if (vSensorUnits2.length === 0) return near;

  for (const v of vSensor) {
    const [x, y] = v.checkerGrid.pos;
    const stageCount = v.currentStage;
    if (stageCount <= 0) continue;

    for (let s = 0; s < stageCount; s++) {
      const image = vSensorUnits2[s % vSensorUnits2.length];
      if (!image) continue;
      const pos: [number, number][] = [];
      for (let q = 0; q <= s; q++) {
        for (const [dx, dy] of STEP_OFFSETS[q]) pos.push([x + dx * GRID, y + dy * GRID]);
      }
      near.push({ pos, image, stage: s });
    }
  }
  return near;
}
