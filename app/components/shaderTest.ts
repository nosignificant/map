import p5 from "p5";
import { CheckerGrid, Frequency, VSensor } from "./Util/types";
import { GRID, CANVAS, TIME } from "./Util/constant";
import { fullGrid, checkerboard } from "./drawings/checkerboard";
import { initVSensor, snapToSensor, findNearCheck, findOtherSensor, updateVSensor, updateConnection, updateFreq } from "./sensors/vSensor";
import { computePos4Shader, shaderCobine } from "./Util/shaderUtil";
import { drawFABRIK, initTentacle } from "./drawings/tentacles";

export function shaderSketch(container: HTMLElement) {
  let fg: CheckerGrid[];
  let checker: CheckerGrid[];
  let vSensor: VSensor[];
  let sketchShader: p5.Shader;
  let noiseTex: p5.Image;
  const units: p5.Image[] = [];
  const sensorPos: number[] = [];
  const freq: Frequency[] = [];

  const myP = new p5((p: p5) => {
    //SETUP//
    //SETUP//
    //SETUP//
    //SETUP//
    p.setup = async () => {
      p.createCanvas(CANVAS, CANVAS, p.WEBGL);
      p.pixelDensity(1);

      // checker init
      checker = checkerboard();
      fg = fullGrid();

      // vsensor init
      vSensor = initVSensor(fg);

      for (const v of vSensor) {
        //tentacle init
        const r = Math.floor(Math.random() * (4 - 2 + 1)) + 1;
        v.tentacles = initTentacle(v, r, 100, 6);
        console.log(v.tentacles);
        sensorPos.push(v.checkerGrid.pos[0], v.checkerGrid.pos[1]);
      }
      while (sensorPos.length < 50) sensorPos.push(0);

      noiseTex = await p.loadImage("/img/noiseTex.png");

      //img init
      fetch("/api/img")
        .then((res) => res.json())
        .then((urls: string[]) => {
          urls.forEach((url) => {
            p.loadImage(url, (loadedImg) => {
              units.push(loadedImg);
            });
          });
        });

      //shader init
      const s = await shaderCobine();
      sketchShader = p.createShader(s.vertSrc, s.fragCombined);
    };

    //DRAW//
    //DRAW//
    //DRAW//
    //DRAW//
    p.draw = () => {
      if (!checker || !vSensor || !sketchShader || !noiseTex) return;

      // vSensor 상태 업데이트
      updateVSensor(p, vSensor, checker, TIME);

      //연결점들 업데이트
      updateFreq(freq, TIME);
      const [segFlat, endPoint] = updateConnection(vSensor, freq);

      // 100개 segment = vec2 200개 = float 400개로 패딩
      const segCount = Math.min(segFlat.length / 4, 100);

      // sensor 상태 추출해서 쉐이더에 보내기
      const sensorT: number[] = [];
      const sensorClick: number[] = [];

      const freqFlat: number[] = [];
      for (const f of freq) {
        if (freqFlat.length >= 100) break; // vec2 50개 = float 100개
        freqFlat.push(f.pos[0], f.pos[1]);
      }
      const freqCount = freqFlat.length / 2;
      while (freqFlat.length < 100) freqFlat.push(0); // 패딩

      for (const v of vSensor) {
        sensorT.push(v.t);
        sensorClick.push(v.clickCount);
      }

      // 셰이더 실행
      p.shader(sketchShader);
      sketchShader.setUniform("uResolution", [CANVAS, CANVAS]);
      sketchShader.setUniform("uGrid", GRID);
      sketchShader.setUniform("uNoise", noiseTex);
      sketchShader.setUniform("uSensorPos", sensorPos);
      sketchShader.setUniform("uSensorT", sensorT.slice(0, 25));
      sketchShader.setUniform("uSensorClick", sensorClick.slice(0, 25));
      sketchShader.setUniform("uSensorCount", vSensor.length);
      sketchShader.setUniform("uSegments", segFlat.slice(0, 400));
      sketchShader.setUniform("uSegmentCount", segCount);
      sketchShader.setUniform("uFreq", freqFlat);
      sketchShader.setUniform("uFreqCount", freqCount);
      while (endPoint.length < 200) endPoint.push(0);
      sketchShader.setUniform("uEndPoint", [endPoint[0], endPoint[1]]);
      p.rect(-CANVAS / 2, -CANVAS / 2, CANVAS, CANVAS);

      if (units[0]) {
        p.resetShader();
        for (const v of vSensor) {
          for (const n of v.near) {
            if (n.distStep === 1) {
              const [x, y] = computePos4Shader(n.checkerGrid.pos);
              p.image(units[0], x - GRID / 2, y - GRID / 2, GRID, GRID);
            }
          }
        }
      }
      p.resetShader();
      for (const v of vSensor) {
        for (const t of v.tentacles) {
          drawFABRIK(p, t, TIME);
        }
      }
    };

    //EVENT//
    //EVENT//
    //EVENT//
    //EVENT//
    p.mouseClicked = () => {
      if (!checker || !vSensor) return;

      const closest = snapToSensor(p, vSensor);
      console.log("closest:", closest.checkerGrid.pos);
      console.log("near:", closest.near);
      closest.near = findNearCheck(p, closest, checker);
      closest.clickCount++;
      closest.t = GRID * closest.clickCount;
      closest.connect = findOtherSensor(p, closest, vSensor, checker);
      p.loop();
    };
  }, container);

  return myP;
}
