import { VSensor, SSensor } from "./Util/types";
import { initVSensor } from "./sensors/vSensor";
import { fullGrid } from "./drawings/checkerboard";

export const fg = fullGrid();
export const vSensor: VSensor[] = initVSensor(fg);

// sSensor
export const sSensor1: SSensor[] = [];
export const sSensor2: SSensor[] = [];

function upsert(arr: SSensor[], angle: number, distance: number) {
  const found = arr.find((s) => s.angle === angle);
  if (found) {
    found.distance = distance;
    found.t = 1;
  } else arr.push({ angle, distance, t: 1 });
}

// 테스트용 우클릭
const TEST_STAGES = [550, 480, 350, 270, 150, 50];
let testStageIdx = 0;

export function randomizeSSensor() {
  const distance = TEST_STAGES[testStageIdx++ % TEST_STAGES.length];
  upsert(sSensor1, Math.floor(Math.random() * 181), distance);
  upsert(sSensor2, Math.floor(Math.random() * 181), distance);
}

// WebSocket
let connected = false;

export function initArduino() {
  if (connected) return;
  connected = true;

  const socket = new WebSocket("ws://localhost:8080");
  socket.onopen = () => console.log("[WS] 연결됨");
  socket.onclose = () => console.log("[WS] 연결 끊김");

  socket.onmessage = (event) => {
    const raw = event.data.trim();
    console.log("[WS 수신]", JSON.stringify(raw));   // ← 들어오는 모든 메시지

    if (raw.startsWith("piezo")) {
      const parts = raw.split(":");
      const sensorId = parseInt(parts[0].replace("piezo", "")) - 1;
      const val = parseInt(parts[1]);
      if (vSensor?.[sensorId]) {
        const [x, y] = vSensor[sensorId].checkerGrid.pos;
        console.log(
          `[piezo${sensorId + 1}] val=${val} → vSensor[${sensorId}] pos=(${x}, ${y})`
        );
        vSensor[sensorId].strength = val;
        vSensor[sensorId].t = 60;
      } else {
        console.warn(`[piezo] vSensor[${sensorId}] 없음 (val=${val})`);
      }
      return;
    }

    const match = raw.match(/sonar(\d+):각도:\s*(\d+)[^\d]*거리:\s*([\d.]+)/);
    if (match) {
      const id = parseInt(match[1]);
      const angle = parseInt(match[2]);
      const distance = parseFloat(match[3]);
      upsert(id === 1 ? sSensor1 : sSensor2, angle, distance);
    }
  };

  socket.onerror = (e) => console.error("WebSocket 에러:", e);
}
