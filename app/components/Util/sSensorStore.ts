import { SSensor } from "./types";

// 소나 센서 데이터 (모든 스케치가 공유)
export const sSensor: SSensor[] = [];

let connected = false;

export function initSSensor() {
  if (connected) return;
  connected = true;

  const socket = new WebSocket("ws://localhost:8080");
  socket.onmessage = (event) => {
    const raw = event.data.trim();
    const match = raw.match(/각도:\s*(\d+)[^\d]*거리:\s*([\d.]+)/);
    if (!match) return;
    const angle = parseInt(match[1]);
    const distance = parseFloat(match[2]);
    upsertSSensor(angle, distance);
  };
}

// 같은 각도가 들어오면 갱신, 없으면 추가
export function upsertSSensor(angle: number, distance: number) {
  const found = sSensor.find((s) => s.angle === angle);
  if (found) {
    found.distance = distance;
    found.t = 1;
  } else {
    sSensor.push({ angle, distance, t: 1 });
  }
}

// 우클릭 테스트용 — 랜덤 거리값으로 채우기
export function randomizeSSensor(step = 5, maxDist = 200) {
  sSensor.length = 0;
  for (let a = 0; a <= 180; a += step) {
    sSensor.push({ angle: a, distance: Math.random() * maxDist, t: 1 });
  }
}
