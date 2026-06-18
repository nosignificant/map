import { VSensor, Ssensor, Vaccumulate, Saccumulate, Accumulate } from "./Util/types";
import { initVSensor, updateVsensor, syncAccumulateLastFreq, applyStrength } from "./sensors/vSensor";
import { fullGrid, fineGrid } from "./drawings/checkerboard";
import { TIME, CANVAS } from "./Util/constant";
import { initSsensorSet, updateSlot, updateSSensor, SLOT_DEG } from "./sensors/sSensor";
import { updateBoids, createBoids } from "./boids";
import { initBoidSound, updateBoidSound, onTouch } from "./audio/boidSound";
import { updateGridSparks } from "./gridSparks";

export const fg = fullGrid();
export const fineFg = fineGrid(); // connection·boid 링크용 (GRID/2)
export const vSensor: VSensor[] = initVSensor(fg);

// sSensor 고정 슬롯 — 위(-1)/아래(+1) 각 6개
export const Ssensor1: Ssensor[] = initSsensorSet(-1);
export const Ssensor2: Ssensor[] = initSsensorSet(1);

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

    // 버튼 누르면 print 출력 트리거
    if (raw === "button:click") {
      window.dispatchEvent(new Event("print-trigger"));
      return;
    }

    // 터치센서 — 누르는 동안 0.2초마다 들어옴 → 드론 피치 상승
    if (raw.startsWith("touch:")) {
      const n = parseInt(raw.split(":")[1]);
      if (!isNaN(n)) onTouch(n);
      return;
    }

    //진동센서 — 이름으로 매칭 (예: "piezo1-A0:512")
    if (raw.startsWith("piezo")) {
      const parts = raw.split(":");
      const name = parts[0].replace("piezo", ""); // "1-A0"
      const val = parseInt(parts[1]);
      const sensor = vSensor.find((v) => v.name === name);
      if (sensor) {
        const [x, y] = sensor.checkerGrid.pos;
        console.log(`[piezo ${name}] val=${val} → pos=(${x}, ${y})`);
        updateVsensorAccumulate(vSensorAccumulate, x, y);

        // 강한 신호만 strength·stage·t 갱신
        applyStrength(sensor, val * 5);
      }
      return;
    }

    const match = raw.match(/sonar(\d+):각도:\s*(\d+)[^\d]*거리:\s*([\d.]+)/);
    if (match) {
      const id = parseInt(match[1]);
      const angle = parseInt(match[2]);
      const distance = parseFloat(match[3]);

      // 고정 슬롯의 거리만 갱신
      const slot = updateSlot(id == 1 ? Ssensor1 : Ssensor2, angle, distance);
      if (slot) {
        updateSsensorAccumulate(id == 1 ? sSensor1Accumulate : sSensor2Accumulate, slot.targetPos[0], slot.targetPos[1], angle, distance);
      }
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
  const s1 = updateSlot(Ssensor1, angle1, distance);
  if (s1) updateSsensorAccumulate(sSensor1Accumulate, s1.targetPos[0], s1.targetPos[1], angle1, distance);

  const angle2 = Math.floor(Math.random() * 181);
  const s2 = updateSlot(Ssensor2, angle2, distance);
  if (s2) updateSsensorAccumulate(sSensor2Accumulate, s2.targetPos[0], s2.targetPos[1], angle2, distance);
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

const BAND_CM = 100; // 거리 band 크기 (1m 단위: 0~1m, 1~2m, …)

export function updateSsensorAccumulate(acc: Saccumulate[], x: number, y: number, angle: number, distance: number) {
  const an = Math.round(angle / SLOT_DEG) * SLOT_DEG;
  const band = Math.floor(distance / BAND_CM); // 거리 band
  // (각도 + band)별로 빈도 — 같은 각도라도 거리대가 다르면 별개
  const found = acc.find((a) => a.angle === an && a.band === band);
  if (found) {
    found.pos[0] = (found.pos[0] * found.freq + x) / (found.freq + 1); // 평균 위치
    found.pos[1] = (found.pos[1] * found.freq + y) / (found.freq + 1);
    found.freq++;
  } else {
    if (acc.length >= MAX_ACCUM) acc.shift();
    acc.push({ pos: [x, y], angle: an, band, freq: 1 });
  }
}

const TEST_MODE = true; // true면 센서 없이 랜덤값으로 시뮬레이션 (전시 땐 false)
const RANDOM_TEST_MS = 2000; // 테스트 랜덤값 주기(ms)

//이미지,tentacle 수명 업데이트(모든업데이트 여기서 함)
let tickStarted = false;
function startSensorTick() {
  if (tickStarted) return;
  if (typeof window === "undefined") return;
  tickStarted = true;

  createBoids(); // 중심 베이스 boid 준비

  // 오디오는 첫 유저 제스처 후에만 시작 가능 (브라우저 정책)
  const startAudio = () => initBoidSound();
  window.addEventListener("pointerdown", startAudio, { once: true });
  window.addEventListener("keydown", startAudio, { once: true });

  // 터치 테스트: 키보드 "1" 누르면 touch:2 신호처럼 (누르고 있으면 키 리피트로 지속)
  window.addEventListener("keydown", (e) => {
    if (e.key === "1") onTouch(2);
  });

  // 테스트: n초마다 vSensor·sSensor에 랜덤값 (TEST_MODE일 때만)
  if (TEST_MODE) {
    setInterval(() => {
      const v = vSensor[Math.floor(Math.random() * vSensor.length)];
      if (v) {
        // 작은 값이 더 자주(제곱), 가끔만 큰 값 — 30~330 범위
        applyStrength(v, 30 + Math.pow(Math.random(), 2) * 500);
        updateVsensorAccumulate(vSensorAccumulate, v.checkerGrid.pos[0], v.checkerGrid.pos[1]);
      }
      randomizeSSensor();
    }, RANDOM_TEST_MS);
  }

  function loop() {
    // ① accumulate 통합 위치 먼저 갱신
    updateAccumulate();

    // ② vSensor 이미지 stage 수명 감소
    updateVsensor(vSensor);

    // 고정 슬롯의 발(촉수): 탐색 → 다른 sonar 찾으면 고정
    updateSSensor(Ssensor1);
    updateSSensor(Ssensor2);

    // boid: 중심 풀 → 활성 vSensor 연결 → 색 boid → 다른 vSensor 연결 (fine 그리드)
    updateBoids(vSensor, fineFg);

    // boid 위치(중심거리) → 드론 사운드
    updateBoidSound();

    // 촘촘한 격자점 산발 흰 십자 (+가끔 vSensor 연결)
    updateGridSparks(fineFg, vSensor);

    // 모든 vSensor 처리 후 1번만 — 다음 프레임 비교 기준 갱신
    syncAccumulateLastFreq(vSensorAccumulate);

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
