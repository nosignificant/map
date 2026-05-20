// WebSocket 한 번만 연결하고 데이터 공유
export const sonarData: Map<number, number> = new Map();

let connected = false;

export function initSonar() {
  if (connected) return;
  connected = true;

  const socket = new WebSocket("ws://localhost:8080");
  socket.onmessage = (event) => {
    const raw = event.data.trim();
    const match = raw.match(/각도:\s*(\d+)[^\d]*거리:\s*([\d.]+)/);
    if (match) {
      sonarData.set(parseInt(match[1]), parseFloat(match[2]));
    }
  };
}
