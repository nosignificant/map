import p5 from "p5";
import { CheckerGrid, VSensor } from "./Util/types";
import { GRID, CANVAS, TIME } from "./Util/constant";
import { fullGrid, checkerboard } from "./drawings/checkerboard";
import { initVSensor, snapToSensor, findNearCheck, findOtherSensor } from "./sensors/vSensor";

export function shaderSketch(container: HTMLElement) {
  let fg: CheckerGrid[];
  let checker: CheckerGrid[];
  let vSensor: VSensor[];
  let sketchShader: p5.Shader;
  let noiseTex: p5.Image;
  const sensorPos: number[] = [];

  const myP = new p5((p: p5) => {
    p.setup = async () => {
      p.createCanvas(CANVAS, CANVAS, p.WEBGL);
      p.pixelDensity(1);

      checker = checkerboard();
      fg = fullGrid();
      vSensor = initVSensor(fg);
      for (const v of vSensor) sensorPos.push(v.checkerGrid.pos[0], v.checkerGrid.pos[1]);
      while (sensorPos.length < 50) sensorPos.push(0);

      noiseTex = await p.loadImage("/img/noiseTex.png");

      const vertSrc = await fetch("/shaders/sketch.vert").then((r) => r.text());
      const fragSrc = await fetch("/shaders/sketch.frag").then((r) => r.text());
      sketchShader = p.createShader(vertSrc, fragSrc);
    };

    p.draw = () => {
      if (!checker || !vSensor || !sketchShader || !noiseTex) return;

      // vSensor 상태 업데이트
      for (const v of vSensor) {
        if (v.clickCount > 0) {
          v.t -= TIME;
          if (v.t <= 0) {
            v.clickCount--;
          }
        }
      }

      // connection 선분 추출 (최대 100개)
      const segFlat: number[] = [];
      for (const v of vSensor) {
        for (const c of v.connect) {
          if (c.path.length === 0) continue;

          const maxT = c.path.length * TIME;
          if (!c.shrinking && c.t >= maxT + TIME * 5) c.shrinking = true;
          c.t += c.shrinking ? -TIME : TIME;

          const drawCount = Math.floor(c.t / TIME);

          if (c.shrinking) {
            const cur = Math.min(drawCount, c.path.length - 1);
            for (let i = 0; i < cur; i++) {
              if (segFlat.length >= 400) break;
              segFlat.push(c.path[i][0], c.path[i][1], c.path[i + 1][0], c.path[i + 1][1]);
            }
          } else {
            const cur = Math.max(0, c.path.length - 1 - drawCount);
            for (let i = cur; i < c.path.length - 1; i++) {
              if (segFlat.length >= 400) break;
              segFlat.push(c.path[i][0], c.path[i][1], c.path[i + 1][0], c.path[i + 1][1]);
            }
          }
        }
      }

      // 100개 segment = vec2 200개 = float 400개로 패딩
      while (segFlat.length < 400) segFlat.push(0);
      const segCount = Math.min(segFlat.length / 4, 100);

      // sensor 상태 추출 (매 프레임)
      const sensorT: number[] = [];
      const sensorClick: number[] = [];
      const nearFlat: number[] = [];
      for (const v of vSensor) {
        sensorT.push(v.t);
        sensorClick.push(v.clickCount);
        for (const n of v.near) {
          if (nearFlat.length >= 400) break;
          nearFlat.push(n.checkerGrid.pos[0], n.checkerGrid.pos[1]);
        }
      }
      while (nearFlat.length < 400) nearFlat.push(0);

      // 셰이더 실행
      p.shader(sketchShader);
      sketchShader.setUniform("uResolution", [CANVAS, CANVAS]);
      sketchShader.setUniform("uGrid", GRID);
      sketchShader.setUniform("uNoise", noiseTex);
      sketchShader.setUniform("uSensorPos", sensorPos.slice(0, 50));
      sketchShader.setUniform("uSensorT", sensorT.slice(0, 25));
      sketchShader.setUniform("uSensorClick", sensorClick.slice(0, 25));
      sketchShader.setUniform("uSensorCount", vSensor.length);
      sketchShader.setUniform("uSegments", segFlat.slice(0, 400));
      sketchShader.setUniform("uSegmentCount", segCount);
      sketchShader.setUniform("uNear", nearFlat);
      sketchShader.setUniform("uNearCount", nearFlat.length / 2);

      p.rect(-CANVAS / 2, -CANVAS / 2, CANVAS, CANVAS);
    };

    p.mouseClicked = () => {
      if (!checker || !vSensor) return;
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
