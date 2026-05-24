const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const WebSocket = require("ws");
const { exec } = require("child_process");
const path = require("path");
const os = require("os");

const PORT_PATH = "/dev/cu.usbserial-10";
const BAUD_RATE = 9600;
const WS_PORT = 8080;

// 인쇄 설정
const PRINT_URL = "http://localhost:3000/print";
const PDF_PATH = path.join(os.tmpdir(), "print-page.pdf");
const CHROME = '"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"';
const PRINT_COOLDOWN_MS = 3000; // 3초 내 중복 인쇄 방지

let lastPrintAt = 0;
let printing = false;

function printPage() {
  const now = Date.now();
  if (printing) {
    console.log("이미 인쇄 중 — 무시");
    return;
  }
  if (now - lastPrintAt < PRINT_COOLDOWN_MS) {
    console.log("쿨다운 중 — 무시");
    return;
  }
  printing = true;
  lastPrintAt = now;

  // 1) 페이지를 PDF로 렌더링 (헤더/푸터 없이)
  const renderCmd = `${CHROME} --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${PDF_PATH}" "${PRINT_URL}"`;

  console.log("→ PDF 생성 중...");
  exec(renderCmd, (err) => {
    if (err) {
      console.error("PDF 생성 실패:", err.message);
      printing = false;
      return;
    }
    // 2) 기본 프린터로 인쇄 (70x70mm 사용자 정의 용지)
    console.log("→ 인쇄 명령 전송");
    exec(`lp -o media=Custom.70x70mm -o fit-to-page "${PDF_PATH}"`, (err2, stdout) => {
      printing = false;
      if (err2) {
        console.error("인쇄 실패:", err2.message);
        return;
      }
      console.log("✅ 인쇄 완료:", stdout.trim());
    });
  });
}

const port = new SerialPort({ path: PORT_PATH, baudRate: BAUD_RATE });
const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`WebSocket 서버 시작: ws://localhost:${WS_PORT}`);

parser.on("data", (line) => {
  const value = line.trim();
  console.log("아두이노:", value);

  // 터치 신호 감지 → 인쇄
  if (value === "TOUCH") {
    printPage();
  }

  // 기존 동작: 웹소켓으로 브로드캐스트
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(value);
    }
  });
});

port.on("error", (err) => console.error("시리얼 에러:", err.message));
