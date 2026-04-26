const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const WebSocket = require("ws");

const PORT_PATH = "/dev/cu.usbserial-10";
const BAUD_RATE = 9600;
const WS_PORT = 8080;

const port = new SerialPort({ path: PORT_PATH, baudRate: BAUD_RATE });
const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`WebSocket 서버 시작: ws://localhost:${WS_PORT}`);

parser.on("data", (line) => {
  const value = line.trim();
  console.log("아두이노:", value);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(value);
    }
  });
});

port.on("error", (err) => console.error("시리얼 에러:", err.message));
