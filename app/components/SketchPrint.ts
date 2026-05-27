import p5 from "p5";
import { GRID, CANVAS, TIME } from "./Util/constant";
import { fg, vSensor, sSensor1, sSensor2, initArduino } from "./Arduino";
import { vSensorUnits, sSensorUnits, initImages } from "./Util/imageStore";
import { updateVsensorImage, updateVSensor, updateConnection } from "./sensors/vSensor";
import { updateSSensorImage, SONAR_R, PX_PER_CELL } from "./sensors/sSensor";
import { computePos4Shader, shaderCobine } from "./Util/shaderUtil";
import { tenOccupied } from "./drawings/tentacles";
import { CheckerGridFreq } from "./Util/types";

const ACCUM_SECONDS = 3; // freq 누적 시간
const FREQ_THRESHOLD = 100;
const DOT_SIZE = 30;

export function SketchPrint(container: HTMLElement) {
  let sketchShader: p5.Shader;
  let noiseTex: p5.Image;
  let lastClear = 0;
  let fgFreq: CheckerGridFreq[] = [];
  const sensorPos: number[] = [];
  const endPointTrail: [number, number][] = [];

  function bumpFreq(pos: [number, number]) {
    let nearest: CheckerGridFreq | null = null;
    let minD = Infinity;
    for (const f of fgFreq) {
      const d = (f.pos[0] - pos[0]) ** 2 + (f.pos[1] - pos[1]) ** 2;
      if (d < minD) {
        minD = d;
        nearest = f;
      }
    }
    if (nearest) nearest.freq++;
  }

  const myP = new p5((p: p5) => {
    p.setup = async () => {
      p.createCanvas(CANVAS, CANVAS, p.WEBGL, undefined);
      p.pixelDensity(1);
      initArduino();
      initImages(p);

      for (const v of vSensor) sensorPos.push(v.checkerGrid.pos[0], v.checkerGrid.pos[1]);
      while (sensorPos.length < 50) sensorPos.push(0);

      fgFreq = fg.map((f) => ({ ...f, freq: 0 }));

      noiseTex = await p.loadImage("/img/noiseTex.png");
      const s = await shaderCobine();
      sketchShader = p.createShader(s.vertSrc, s.fragCombined);

      window.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        const canvas = p.canvas as HTMLCanvasElement;
        const link = document.createElement("a");
        link.download = "print.png";
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    };

    p.draw = () => {
      if (!sketchShader || !noiseTex) return;
      p.background(255);

      updateVSensor(vSensor, TIME);
      const [segFlat, endPoint, realSegCount] = updateConnection(vSensor, fg);
      const tOccupied = tenOccupied(fg, vSensor);
      const tenUnique = tOccupied.filter((pos, i) => tOccupied.findIndex((p) => p[0] === pos[0] && p[1] === pos[1]) === i);
      const tenFlat = tenUnique.flatMap(([x, y]) => [x, y]);

      const vSensorT: number[] = [];
      for (const v of vSensor) vSensorT.push(v.t);

      p.shader(sketchShader);
      sketchShader.setUniform("uResolution", [CANVAS, CANVAS]);
      sketchShader.setUniform("uGrid", GRID);
      sketchShader.setUniform("uNoise", noiseTex);
      sketchShader.setUniform("uSensorPos", sensorPos);
      sketchShader.setUniform("uSensorT", vSensorT.slice(0, 25));
      sketchShader.setUniform("uSensorCount", vSensor.length);
      sketchShader.setUniform("uSegments", segFlat.slice(0, 400));
      sketchShader.setUniform("uSegmentCount", Math.min(realSegCount, 50));
      while (endPoint.length < 2) endPoint.push(0);
      sketchShader.setUniform("uEndPoint", [endPoint[0], endPoint[1]]);
      sketchShader.setUniform("uTenOccupied", tenFlat.slice(0, 400));
      sketchShader.setUniform("uTenCount", Math.min(tenUnique.length, 200));

      if (endPoint[0] !== 0 || endPoint[1] !== 0) {
        endPointTrail.unshift([endPoint[0], endPoint[1]]);
        if (endPointTrail.length > 50) endPointTrail.pop();
      }
      const trailFlat = endPointTrail.flatMap(([x, y]) => [x, y]);
      while (trailFlat.length < 100) trailFlat.push(0);
      sketchShader.setUniform("uTrail", trailFlat.slice(0, 100));
      sketchShader.setUniform("uTrailCount", endPointTrail.length);

      p.noStroke();
      p.rect(-CANVAS / 2, -CANVAS / 2, CANVAS, CANVAS);
      p.resetShader();

      // vSensor 이미지
      const nearImgs = updateVsensorImage(vSensor, vSensorUnits);
      for (const n of nearImgs)
        for (const pos of n.pos) {
          const [x, y] = computePos4Shader(pos);
          p.image(n.image, x - GRID / 2, y - GRID / 2, GRID, GRID);
        }

      // sSensor 이미지
      const sonarScale = CANVAS / (SONAR_R * 2);
      const cellPx = PX_PER_CELL * sonarScale;
      for (const item of updateSSensorImage(sSensor1, -1, sSensorUnits, sonarScale))
        p.image(item.image, item.pos[0] - cellPx / 2, item.pos[1] - cellPx / 2, cellPx, cellPx);
      for (const item of updateSSensorImage(sSensor2, 1, sSensorUnits, sonarScale))
        p.image(item.image, item.pos[0] - cellPx / 2, item.pos[1] - cellPx / 2, cellPx, cellPx);

      // N초마다 freq clear
      if (p.millis() - lastClear > ACCUM_SECONDS * 1000) {
        for (const f of fgFreq) f.freq = 0;
        lastClear = p.millis();
      }

      // freq 누적
      for (const pos of tenUnique) bumpFreq(pos);
      for (const v of vSensor) if (v.strength > 0) bumpFreq(v.checkerGrid.pos);
      for (const item of updateSSensorImage(sSensor1, -1, sSensorUnits, sonarScale))
        bumpFreq([item.pos[0] + CANVAS / 2, item.pos[1] + CANVAS / 2]);
      for (const item of updateSSensorImage(sSensor2, 1, sSensorUnits, sonarScale))
        bumpFreq([item.pos[0] + CANVAS / 2, item.pos[1] + CANVAS / 2]);

      // freq 임계값 넘은 위치에 검은 점
      p.fill(0);
      p.noStroke();
      for (const f of fgFreq) {
        if (f.freq >= FREQ_THRESHOLD) {
          p.circle(f.pos[0] - CANVAS / 2, f.pos[1] - CANVAS / 2, DOT_SIZE);
        }
      }
    };
  }, container);

  return myP;
}
