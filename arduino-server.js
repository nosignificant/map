const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const WebSocket = require("ws");
const { exec } = require("child_process");
const path = require("path");
const os = require("os");

// 아두이노 2대 — 둘 다 읽어서 같은 WebSocket으로 합쳐 보냄
const PORT_PATHS = ["/dev/cu.usbserial-10", "/dev/cu.usbserial-110"];
const BAUD_RATE = 9600;
const WS_PORT = 8080;

const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`WebSocket 서버 시작: ws://localhost:${WS_PORT}`);

function handleLine(value, portName) {
  console.log(`[${portName}]`, value);

  // 터치 신호 감지 → 인쇄
  if (value === "TOUCH") {
    printPage();
    return;
  }

  // 웹소켓으로 브로드캐스트
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(value);
    }
  });
}

// 각 포트 열고 리스너 연결
for (const p of PORT_PATHS) {
  const port = new SerialPort({ path: p, baudRate: BAUD_RATE });
  const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));
  parser.on("data", (line) => handleLine(line.trim(), p));
  port.on("open", () => console.log(`시리얼 연결됨: ${p}`));
  port.on("error", (err) => console.error(`시리얼 에러 [${p}]:`, err.message));
}
