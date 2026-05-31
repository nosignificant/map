import { VSensor, Ssensor, Vaccumulate, Saccumulate, Accumulate } from "./Util/types";
import { initVSensor } from "./sensors/vSensor";
import { fullGrid } from "./drawings/checkerboard";
import { INITtime, TIME, CANVAS } from "./Util/constant";
import { initSsensor, updateSSensorImage, CMtoPX, ANGLE_STEP } from "./sensors/sSensor";
import { tenOccupied, updateTtentacle, syncAccumulateLastFreq, updateStentacle } from "./drawings/tentacles";
import { initParticles, updateParticles } from "./particles";

export const fg = fullGrid();
export const vSensor: VSensor[] = initVSensor(fg);

// 매 tick에서 갱신되는 씬 데이터 (Sketch에서 import해서 그대로 사용)
export const tOccupied: [number, number][] = [];

// 셰이더용 센서 위치 배열 (50개로 패딩)
export const sensorPos: number[] = [];
for (const v of vSensor) {
  sensorPos.push(v.checkerGrid.pos[0], v.checkerGrid.pos[1]);
}
while (sensorPos.length < 50) sensorPos.push(0);

// sSensor 위쪽 반원
export const Ssensor1: Ssensor[] = [];

// sSensor 아래쪽 반원
export const Ssensor2: Ssensor[] = [];

//accumulate
export const vSensorAccumulate: Vaccumulate[] = [];
export const sSensor1Accumulate: Saccumulate[] = [];
export const sSensor2Accumulate: Saccumulate[] = [];
export const accumulate: Accumulate[] = [];

// WebSocket
let connected = false;

export function initArduino() {
  if (connected) return;
  connected = true;

  startSensorTick();

  // 누적 데이터 복구 + 주기 자동 저장
  loadAccumulateFromDisk();
  if (typeof window !== "undefined" && !saveTimer) {
    saveTimer = setInterval(saveAccumulateToDisk, SAVE_INTERVAL_MS);
    // 페이지 닫힐 때 한 번 더 저장
    window.addEventListener("beforeunload", () => saveAccumulateToDisk());
  }

  const socket = new WebSocket("ws://localhost:8080");
  socket.onopen = () => console.log("[WS] 연결됨");
  socket.onclose = () => console.log("[WS] 연결 끊김");

  socket.onmessage = (event) => {
    const raw = event.data.trim();

    //진동센서
    if (raw.startsWith("piezo")) {
      const parts = raw.split(":");
      const sensorId = parseInt(parts[0].replace("piezo", ""));
      const val = parseInt(parts[1]);
      if (vSensor?.[sensorId]) {
        const [x, y] = vSensor[sensorId].checkerGrid.pos;
        console.log(`[piezo${sensorId + 1}] val=${val} → vSensor[${sensorId}] pos=(${x}, ${y})`);

        //신호가 약해서 * 5를 했음
        vSensor[sensorId].strength = val;

        //개수 증가
        updateVsensorAccumulate(vSensorAccumulate, x, y);
      }
      return;
    }

    const match = raw.match(/sonar(\d+):각도:\s*(\d+)[^\d]*거리:\s*([\d.]+)/);
    if (match) {
      const id = parseInt(match[1]);
      const angle = parseInt(match[2]);
      const distance = parseFloat(match[3]);
      const newSSimg = initSsensor(angle, distance, INITtime, id == 1 ? -1 : 1);
      if (newSSimg == null) return;
      if (id == 1) Ssensor1.push(newSSimg);
      else if (id == 2) Ssensor2.push(newSSimg);

      //개수 증가 — angle, distance 원본값 전달
      updateSsensorAccumulate(id == 1 ? sSensor1Accumulate : sSensor2Accumulate, newSSimg.pos[0], newSSimg.pos[1], angle);
    }
  };

  socket.onerror = (e) => console.error("WebSocket 에러:", e);
}

// 테스트용 우클릭
const TEST_STAGES = [550, 480, 350, 270, 150, 50];
let testStageIdx = 0;

export function randomizeSSensor() {
  const distance = TEST_STAGES[testStageIdx++ % TEST_STAGES.length];

  const angle1 = Math.floor(Math.random() * 181);
  const img1 = initSsensor(angle1, distance, INITtime, -1);
  if (img1) {
    Ssensor1.push(img1);
    updateSsensorAccumulate(sSensor1Accumulate, img1.pos[0], img1.pos[1], angle1);
  }

  const angle2 = Math.floor(Math.random() * 181);
  const img2 = initSsensor(angle2, distance, INITtime, 1);
  if (img2) {
    Ssensor2.push(img2);
    updateSsensorAccumulate(sSensor2Accumulate, img2.pos[0], img2.pos[1], angle2);
  }
}

// ===== 누적 데이터 로드/저장 (전시용 영구 보존) =====
const SAVE_INTERVAL_MS = 30000; // 30초마다 자동 저장
let saveTimer: ReturnType<typeof setInterval> | null = null;

// 페이지 시작 시 디스크에서 불러오기
async function loadAccumulateFromDisk() {
  try {
    const res = await fetch("/api/accumulate");
    const data = await res.json();
    (data.vSensorAccumulate ?? []).forEach((a: Vaccumulate) => vSensorAccumulate.push(a));
    (data.sSensor1Accumulate ?? []).forEach((a: Saccumulate) => sSensor1Accumulate.push(a));
    (data.sSensor2Accumulate ?? []).forEach((a: Saccumulate) => sSensor2Accumulate.push(a));
    console.log(`[누적 복구] v:${vSensorAccumulate.length}, s1:${sSensor1Accumulate.length}, s2:${sSensor2Accumulate.length}`);
  } catch (e) {
    console.warn("[누적 로드 실패]", e);
  }
}

// 디스크에 저장 (POST)
export async function saveAccumulateToDisk() {
  try {
    await fetch("/api/accumulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vSensorAccumulate,
        sSensor1Accumulate,
        sSensor2Accumulate,
      }),
    });
  } catch (e) {
    console.warn("[누적 저장 실패]", e);
  }
}

const MAX_ACCUM = 100;

export function updateVsensorAccumulate(acc: Vaccumulate[], x: number, y: number) {
  const found = acc.find((a) => a.pos[0] === x && a.pos[1] === y);
  if (found) {
    found.freq++;
  } else {
    if (acc.length >= MAX_ACCUM) acc.shift();
    acc.push({ pos: [x, y], freq: 1 });
  }
}

export function updateSsensorAccumulate(acc: Saccumulate[], x: number, y: number, angle: number) {
  const an = Math.round(angle / ANGLE_STEP) * ANGLE_STEP;
  const found = acc.find((a) => a.angle === an);
  if (found) {
    found.freq++;
  } else {
    if (acc.length >= MAX_ACCUM) acc.shift();
    acc.push({ pos: [x, y], angle: an, freq: 1 });
  }
}

//이미지,tentacle 수명 업데이트(모든업데이트 여기서 함)
let tickStarted = false;
function startSensorTick() {
  if (tickStarted) return;
  if (typeof window === "undefined") return;
  tickStarted = true;

  //initParticles();

  function loop() {
    // ① accumulate 통합 위치 먼저 갱신
    updateAccumulate();

    // ② 촉수 업데이트 (최신 accumulate 사용)
    updateTtentacle(vSensorAccumulate, accumulate, vSensor, fg);

    const newOcc = tenOccupied(fg, vSensor);
    tOccupied.length = 0;
    tOccupied.push(...newOcc);

    //t 확인하고 0 되면 제거
    updateSSensorImage(sSensor1Accumulate, Ssensor1, TIME);
    updateSSensorImage(sSensor2Accumulate, Ssensor2, TIME);

    // sSensor 발 target 설정 (없으면 drawFABRIK이 안 그림)
    updateStentacle(Ssensor1, fg);
    updateStentacle(Ssensor2, fg);

    // 모든 vSensor 처리 후 1번만 — 다음 프레임 비교 기준 갱신
    syncAccumulateLastFreq(vSensorAccumulate);

    // ③ 배경 파티클 — accum(끌림) + tOccupied(밀림)
    //    sSensor accum은 center-origin이라 +CANVAS/2로 top-left 변환
    const attractors = [
      ...vSensorAccumulate.map((a) => ({ pos: a.pos, freq: a.freq })),
      ...sSensor1Accumulate.map((a) => ({ pos: [a.pos[0] + CANVAS / 2, a.pos[1] + CANVAS / 2] as [number, number], freq: a.freq })),
      ...sSensor2Accumulate.map((a) => ({ pos: [a.pos[0] + CANVAS / 2, a.pos[1] + CANVAS / 2] as [number, number], freq: a.freq })),
    ];
    //updateParticles(attractors, tOccupied);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function updateAccumulate() {
  accumulate.length = 0;
  accumulate.push(...vSensorAccumulate.map((a) => ({ pos: a.pos, freq: a.freq })));
  accumulate.push(...sSensor1Accumulate.map((a) => ({ pos: a.pos, freq: a.freq })));
  accumulate.push(...sSensor2Accumulate.map((a) => ({ pos: a.pos, freq: a.freq })));
}
