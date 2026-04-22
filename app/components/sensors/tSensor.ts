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
