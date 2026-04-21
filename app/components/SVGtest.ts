import p5 from "p5";
import { MorphFn, Sign, checkerGrid } from "./Util/types";
import { loadPath, setupSign } from "./Util/SVGUtils";
import { interpolate } from "flubber";
import { GRID, DISPLAY_SIZE, CANVAS_W, CANVAS_H, DEFAULT_TREE, RIVER_STEP } from "./Util/constant";
import { backGroundSetup, checkerboard, draw5x5 } from "./Util/background";

const GROW_SPEED = 0.009;

//마우스 지정한 blackboard 중심지마다 n초씩 추가해서 강도 강하게 원그리기? - 시간 지나면 원 줄어들게 하기?
type vStrength = { t: number };

export function SVGsketch(container: HTMLElement) {
  let morph: MorphFn;
  let s1: Sign;
  let checker: checkerGrid[];
  let vSensor: [number, number][];

  const myP = new p5((p: p5) => {
    p.setup = async () => {
      //
      //canvas setting
      p.createCanvas(CANVAS_W, CANVAS_H);

      //path setting
      const pathA = await loadPath("/svg/1.svg");
      const pathB = await loadPath("/svg/2.svg");
      morph = interpolate(pathA, pathB, {
        maxSegmentLength: 2,
        string: false,
      }) as unknown as MorphFn;

      checker = checkerboard();
    };

    // draw //
    // draw //
    // draw //
    p.draw = () => {
      //await으로 뭔가 받아오기 전에 그리지 말자!
      backGroundSetup(p);
      draw5x5(p, checker);
      const vSensor = draw5x5(p, checker);
      for (const c of checker) {
        const [x, y] = c.pos;
        p.fill(255);
        p.circle(x, y, GRID);
      }

      for (const [x, y] of vSensor) {
        p.noFill();
        p.stroke(255, 0, 0);
        p.circle(x, y, GRID);
      }
      p.strokeWeight(1);
    };
  }, container);
  return myP;
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

//8방향으로 1칸씩 늘림
function pointSnapAndDilate(points: [number, number][]): [number, number][] {
  const set = new Set<string>();
  const result: [number, number][] = [];

  const dirs = [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  for (const [x, y] of points) {
    // 스냅하기
    const cx = Math.floor(x / GRID) * GRID;
    const cy = Math.floor(y / GRID) * GRID;

    for (const [dr, dc] of dirs) {
      const nx = cx + dc * GRID;
      const ny = cy + dr * GRID;
      const key = `${nx},${ny}`;
      if (!set.has(key)) {
        set.add(key);
        result.push([nx, ny]);
      }
    }
  }
  return result;
}

function drawSVGOccupied(p: p5, points: [number, number][], offsetX: number, offsetY: number) {
  for (const [x, y] of points) {
    const scale = 3;
    p.rect(x * scale + offsetX, y * scale + offsetY, GRID, GRID);
  }
}
