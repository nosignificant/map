import p5 from "p5";
import { MorphFn, Sign, checkerGrid, TestClick } from "./Util/types";
import { loadPath, setupSign } from "./Util/SVGUtils";
import { interpolate } from "flubber";
import { GRID, CANVAS_W, CANVAS_H } from "./Util/constant";
import { backGroundSetup } from "./drawings/background";
import { checkerboard, initVSensor, draw5x5, snapToSensor, updateVSensor } from "./drawings/checkerboard";

export function SVGsketch(container: HTMLElement) {
  let morph: MorphFn;
  let s1: Sign;
  let checker: checkerGrid[];
  let vSensor: TestClick[];

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

      //checkerboard initiate
      checker = checkerboard();
      vSensor = initVSensor(checker);
    };

    // draw //
    // draw //
    // draw //
    p.draw = () => {
      if (!checker || !vSensor) return;

      //await으로 뭔가 받아오기 전에 그리지 말자!
      backGroundSetup(p);
      draw5x5(p, vSensor);
      for (const c of checker) {
        const [x, y] = c.pos;
        p.fill(255);
        p.circle(x, y, GRID);
      }
      // 센서들 위치 그리기
      for (const s of vSensor) {
        const [x, y] = [s.checkerGrid.pos[0], s.checkerGrid.pos[1]];
        p.noFill();
        p.stroke(255, 0, 0);
        p.circle(x, y, GRID);
      }
      p.strokeWeight(1);
      updateVSensor(p, vSensor);
    };

    p.mouseClicked = () => {
      const cloest = snapToSensor(p, vSensor);
      cloest.clickCount++;
      p.loop();
    };
  }, container);
  return myP;
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
