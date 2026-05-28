import { VSensor, Ssensor, Accumulate, SsensorImagePos } from "./Util/types";
import { initVSensor, updateConnection, updateCurrentTrail, vSensorAlert } from "./sensors/vSensor";
import { fullGrid } from "./drawings/checkerboard";
import { sSensorUnits } from "./Util/imageStore";
import { INITtime, TIME } from "./Util/constant";
import { initSsensorIMGpos, updateSSensorImage } from "./sensors/sSensor";
import { initTentacle, tenOccupied, updateTentacle } from "./drawings/tentacles";

export const fg = fullGrid();
export const vSensor: VSensor[] = initVSensor(fg);

for (const v of vSensor) {
  v.tentacles = initTentacle(v, 1, 100, 6);
}
// 매 tick에서 갱신되는 씬 데이터 (Sketch에서 import해서 그대로 사용)
export const tOccupied: [number, number][] = [];
export const segFlat: number[] = [];
export const conn = { realSegCount: 0 };

// 셰이더용 센서 위치 배열 (50개로 패딩)
export const sensorPos: number[] = [];
for (const v of vSensor) {
  sensorPos.push(v.checkerGrid.pos[0], v.checkerGrid.pos[1]);
}
while (sensorPos.length < 50) sensorPos.push(0);

// sSensor 위쪽 반원
export const sSensor1: Ssensor = { id: 1, angle: 0, distance: 0, dir: -1 };
export const currentSsensor1IMG: SsensorImagePos[] = [];

// sSensor 아래쪽 반원
export const sSensor2: Ssensor = { id: 2, angle: 0, distance: 0, dir: 1 };
export const currentSsensor2IMG: SsensorImagePos[] = [];

//accumulate
export const vSensorAccumulate: Accumulate[] = [];
export const sSensor1Accumulate: Accumulate[] = [];
export const sSensor2Accumulate: Accumulate[] = [];

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
    // 콘솔에서 수동 호출 가능
    // @ts-expect-error dev convenience
    window.saveAccumulateToDisk = saveAccumulateToDisk;
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
        updateAccumulate(vSensorAccumulate, x, y);
      }
      return;
    }

    const match = raw.match(/sonar(\d+):각도:\s*(\d+)[^\d]*거리:\s*([\d.]+)/);
    if (match) {
      const id = parseInt(match[1]);
      const angle = parseInt(match[2]);
      const distance = parseFloat(match[3]);
      const newSSimg = initSsensorIMGpos(angle, distance, INITtime, id == 1 ? -1 : 1, sSensorUnits);
      if (newSSimg == null) return;
      if (id == 1) currentSsensor1IMG.push(newSSimg);
      else if (id == 2) currentSsensor2IMG.push(newSSimg);

      //개수 증가
      updateAccumulate(id == 1 ? sSensor1Accumulate : sSensor2Accumulate, newSSimg.pos[0], newSSimg.pos[1]);
    }
  };

  socket.onerror = (e) => console.error("WebSocket 에러:", e);
}

// 테스트용 우클릭
const TEST_STAGES = [550, 480, 350, 270, 150, 50];
let testStageIdx = 0;

export function randomizeSSensor() {
  const distance = TEST_STAGES[testStageIdx++ % TEST_STAGES.length];

  const img1 = initSsensorIMGpos(Math.floor(Math.random() * 181), distance, INITtime, -1, sSensorUnits);
  if (img1) {
    currentSsensor1IMG.push(img1);
    updateAccumulate(sSensor1Accumulate, img1.pos[0], img1.pos[1]);
  }

  const img2 = initSsensorIMGpos(Math.floor(Math.random() * 181), distance, INITtime, 1, sSensorUnits);
  if (img2) {
    currentSsensor2IMG.push(img2);
    updateAccumulate(sSensor2Accumulate, img2.pos[0], img2.pos[1]);
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
    (data.vSensorAccumulate ?? []).forEach((a: Accumulate) => vSensorAccumulate.push(a));
    (data.sSensor1Accumulate ?? []).forEach((a: Accumulate) => sSensor1Accumulate.push(a));
    (data.sSensor2Accumulate ?? []).forEach((a: Accumulate) => sSensor2Accumulate.push(a));
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

//이미지 누적 관리
const MAX_ACCUM = 200; // 배열 최대 크기 (메모리 보호)

export function updateAccumulate(acc: Accumulate[], x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);

  const found = acc.find((a) => a.pos[0] === ix && a.pos[1] === iy);
  if (found) {
    found.freq++;
    vSensorAlert(found.pos[0], found.pos[1], vSensor, fg);
  } else {
    if (acc.length >= MAX_ACCUM) acc.shift();
    acc.push({ pos: [ix, iy], freq: 1 });
  }
}

//이미지,tentacle 수명 업데이트(모든업데이트 여기서 함)
let tickStarted = false;
function startSensorTick() {
  if (tickStarted) return;
  if (typeof window === "undefined") return;
  tickStarted = true;

  function loop() {
    const newOcc = tenOccupied(fg, vSensor);
    tOccupied.length = 0;
    tOccupied.push(...newOcc);

    // trail 진행도 갱신
    const [newSeg, newCount] = updateCurrentTrail(vSensor);
    segFlat.length = 0;
    segFlat.push(...newSeg);
    conn.realSegCount = newCount;

    //t 확인하고 0 되면 제거
    updateSSensorImage(currentSsensor1IMG, TIME);
    updateSSensorImage(currentSsensor2IMG, TIME);

    for (const v of vSensor) {
      updateTentacle(vSensorAccumulate, v);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
