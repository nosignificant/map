import p5 from "p5";
import { MorphFn, Sign, CheckerGrid, VSensor, Connect } from "./Util/types";
import { loadPath, setupSign } from "./Util/SVGUtils";
import { interpolate } from "flubber";
import { GRID, CANVAS, TIME } from "./Util/constant";
import { backGroundSetup } from "./drawings/background";
import { fullGrid, checkerboard, draw5x5 } from "./drawings/checkerboard";
import { IZA } from "./IZA";
import { initVSensor, snapToSensor, updateVSensor, vSensored, findNearCheck, findOtherSensor, drawConnections } from "./sensors/vSensor";
import { drawTSensor } from "./sensors/tSensor";

export function SVGsketch(container: HTMLElement) {
  let morph: MorphFn;
  let s1: Sign;
  let fg: CheckerGrid[];
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
      fg = fullGrid();
      vSensor = initVSensor(fg);
      console.log(fg.find((c) => c.grid.ri === 3));
      console.log(vSensor[0]);
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

      //배경 교차되는 점들 그림
      for (const c of checker) {
        const [x, y] = c.pos;
        p.fill(210, 210, 210);
        p.noStroke();
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
      updateVSensor(p, vSensor, checker, TIME);
      IZA(p);
      for (const v of vSensor) drawConnections(p, v.connect, checker);
    };

    //mouseEvent
    p.mouseClicked = () => {
      const closest = snapToSensor(p, vSensor);
      closest.near = findNearCheck(p, closest, checker);
      closest.clickCount++;
      closest.t = GRID * closest.clickCount;
      closest.connect = findOtherSensor(p, closest, vSensor, checker);
      p.loop();
    };
  }, container);
  return myP;
}
