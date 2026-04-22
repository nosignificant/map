import p5 from "p5";
import { MorphFn, Sign, CheckerGrid, VSensor } from "./Util/types";
import { loadPath, setupSign } from "./Util/SVGUtils";
import { interpolate } from "flubber";
import { GRID, CANVAS, TIME } from "./Util/constant";
import { backGroundSetup } from "./drawings/background";
import { checkerboard, draw5x5 } from "./drawings/checkerboard";
import { IZA } from "./IZA";
import { initVSensor, snapToSensor, updateVSensor, vSensored, findNearCheck } from "./sensors/vSensor";
import { drawTSensor } from "./sensors/tSensor";

export function SVGsketch(container: HTMLElement) {
  let morph: MorphFn;
  let s1: Sign;
  let checker: CheckerGrid[];
  let vSensor: VSensor[];

  const myP = new p5((p: p5) => {
    p.setup = async () => {
      //
      //canvas setting
      p.createCanvas(CANVAS, CANVAS);

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
      console.log(checker.filter((c) => c.grid.ri === 15));
    };

    // draw //
    // draw //
    // draw //
    p.draw = () => {
      if (!checker || !vSensor) return;

      //await으로 뭔가 받아오기 전에 그리지 말자!
      backGroundSetup(p);
      drawTSensor(p);
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
      vSensored(p, vSensor);
      updateVSensor(p, vSensor, TIME);
      IZA(p);
    };

    //mouseEvent
    p.mouseClicked = () => {
      const closest = snapToSensor(p, vSensor);
      closest.near = findNearCheck(p, closest, checker);
      closest.clickCount++;
      closest.t = GRID * 2.5;
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
