import type p5 from "p5";
import { CANVAS } from "../Util/constant";

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
