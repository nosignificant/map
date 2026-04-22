import { MorphFn, Sign } from "./types";
import p5 from "p5";
import { GRID, DISPLAY_SIZE, CANVAS_W, CANVAS_H, DEFAULT_TREE, RIVER_STEP } from "./constant";

const GROW_SPEED = 0.009;

export function setupSign(m: MorphFn, mc: number): Sign {
  return { morphFn: m, grow: 0, cooldown: 0, maxCool: mc, shrink: 0, repeat: 0 };
}

export async function loadPath(url: string): Promise<string> {
  const res = await fetch(url);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  return doc.querySelector("path")?.getAttribute("d") ?? "";
}

function updateAndDraw(p: p5, s: Sign, offsetX: number, offsetY: number): [number, number][] | null {
  const points = updateSign(s, GROW_SPEED);
  if (!points) return null;
  drawSVG(p, points, offsetX, offsetY);
  return points;
}

function drawSVG(p: p5, points: [number, number][], offsetX: number, offsetY: number) {
  p.beginShape();
  for (const [x, y] of points) {
    const scale = 3;
    const cx = offsetX;
    const cy = offsetY;
    p.vertex(x * scale + cx, y * scale + cy);
  }
  p.endShape(p.CLOSE);
}

function updateSign(s: Sign, t: number): [number, number][] {
  if (s.repeat >= 1) return s.morphFn(0);
  if (s.shrink > 0) {
    s.shrink = Math.max(0, s.shrink - t);
    if (s.shrink <= 0) s.repeat++; // ← 여기
    return s.morphFn(s.shrink);
  } else if (s.cooldown > 0) {
    //
    // cooldown이 0이하가 되면 shrink 세팅
    s.cooldown = Math.max(0, s.cooldown - t);
    if (s.cooldown <= 0) s.shrink = 1;
    return s.morphFn(1);
  } else {
    //
    //grow가 1 이상이 되면 cooldown 세팅
    s.grow = Math.min(1, s.grow + t);
    if (s.grow >= 1) s.cooldown = s.maxCool;
    return s.morphFn(s.grow);
  }
}
function drawSVGOccupied(p: p5, points: [number, number][], offsetX: number, offsetY: number) {
  for (const [x, y] of points) {
    const scale = 3;
    p.rect(x * scale + offsetX, y * scale + offsetY, GRID, GRID);
  }
}
