import type p5 from "p5";
import { CANVAS, CENTER, CORNER } from "../Util/constant";

export function drawTSensor(p: p5) {
  const ctx = p.drawingContext as CanvasRenderingContext2D;
  for (const [x, y] of CORNER) {
    const grad = ctx.createLinearGradient(x, y, CENTER, CENTER);
    grad.addColorStop(1, "#000000");
    grad.addColorStop(0.5, "#c4e6f4");
    grad.addColorStop(0, "#e62a5a");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 50;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(CANVAS / 2, CANVAS / 2);
    ctx.stroke();
  }
}

export function playToneFromPos(ctx: AudioContext, pos: [number, number], delay: number = 0) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const freq = 200 + (pos[0] / CANVAS) * 600;
  const type = pos[1] < CANVAS / 2 ? "sine" : "triangle";

  osc.frequency.value = freq;
  osc.type = type;

  // 시작 시각에 delay 더하기
  const startTime = ctx.currentTime + delay;
  gain.gain.setValueAtTime(0.2, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime); // 시작 시각
  osc.stop(startTime + 0.5); // 종료 시각
}
