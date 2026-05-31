import p5 from "p5";
import { CANVAS, GRID } from "./Util/constant";
import { checkerboard } from "./drawings/checkerboard";
import { vSensor, randomizeSSensor, initArduino, vSensorAccumulate, updateVsensorAccumulate, fg, tOccupied } from "./Arduino";
import { shaderCobine } from "./Util/shaderUtil";
import { initImages } from "./Util/imageStore";
import { drawFABRIK } from "./drawings/tentacles";
import { drawConnection, vSensorAlert } from "./sensors/vSensor";
import { CheckerGrid } from "./Util/types";

export function Sketch(container: HTMLElement) {
  let checker: CheckerGrid[];
  let sketchShader: p5.Shader;
  let noiseTex: p5.Image;

  const myP = new p5((p: p5) => {
    p.setup = async () => {
      p.createCanvas(CANVAS, CANVAS, p.WEBGL, undefined, { alpha: true });
      p.pixelDensity(1);
      initArduino();

      (p.canvas as HTMLCanvasElement).oncontextmenu = (e) => e.preventDefault();
      checker = checkerboard();
      initImages(p);

      noiseTex = await p.loadImage("/img/noiseTex.png");
      const s = await shaderCobine();
      sketchShader = p.createShader(s.vertSrc, s.fragCombined);
    };

    p.draw = () => {
      if (!checker || !sketchShader || !noiseTex) return;
      p.clear();

      // 2) 연결선 + 사각형 (p5로 직접)
      drawConnection(p, vSensor);
      // 1) tapestry 셰이더 배경
      const tenUnique = tOccupied.filter((pos, i) => tOccupied.findIndex((q) => q[0] === pos[0] && q[1] === pos[1]) === i);
      const tenFlat = tenUnique.flatMap(([x, y]) => [x, y]);

      p.shader(sketchShader);
      sketchShader.setUniform("uResolution", [CANVAS, CANVAS]);
      sketchShader.setUniform("uGrid", GRID);
      sketchShader.setUniform("uNoise", noiseTex);
      sketchShader.setUniform("uTenOccupied", tenFlat.slice(0, 400));
      sketchShader.setUniform("uTenCount", Math.min(tenUnique.length, 200));
      p.noStroke();
      p.rect(-CANVAS / 2, -CANVAS / 2, CANVAS, CANVAS);
      p.resetShader();

      // 3) 촉수 (vSensor당 1개)
      for (const v of vSensor) {
        const acc = vSensorAccumulate.find((a) => a.pos[0] === v.checkerGrid.pos[0] && a.pos[1] === v.checkerGrid.pos[1]);
        drawFABRIK(p, v.tentacle, acc);
      }
    };

    p.mousePressed = (e: MouseEvent) => {
      if (!vSensor) return;
      if (p.mouseX < 0 || p.mouseX > CANVAS || p.mouseY < 0 || p.mouseY > CANVAS) return;

      const button = e?.button ?? 0;

      if (button === 2) {
        randomizeSSensor();
        return;
      }

      // 좌클릭: 가장 가까운 vSensor strength 증가
      let closest = vSensor[0];
      let minDist = Infinity;
      for (const v of vSensor) {
        const [x, y] = v.checkerGrid.pos;
        const d = p.dist(p.mouseX, p.mouseY, x, y);
        if (d < minDist) {
          minDist = d;
          closest = v;
        }
      }
      closest.strength += 100;

      const [cx, cy] = closest.checkerGrid.pos;
      updateVsensorAccumulate(vSensorAccumulate, cx, cy);
      vSensorAlert(cx, cy, vSensor, fg);
    };
  }, container);

  return myP;
}
