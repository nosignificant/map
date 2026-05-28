import p5 from "p5";
import { GRID, CANVAS, TIME } from "./Util/constant";
import { checkerboard } from "./drawings/checkerboard";
import { vSensor, sensorPos, randomizeSSensor, initArduino, vSensorAccumulate, updateAccumulate, tOccupied, segFlat, conn } from "./Arduino";
import { shaderCobine } from "./Util/shaderUtil";
import { initImages } from "./Util/imageStore";
import { drawFABRIK } from "./drawings/tentacles";
import { playToneFromPos } from "./sensors/tSensor";
import { CheckerGrid } from "./Util/types";

export function Sketch(container: HTMLElement) {
  let checker: CheckerGrid[];
  let sketchShader: p5.Shader;
  let noiseTex: p5.Image;
  let sonarGfx: p5.Graphics;
  //웹 소리
  let audioCtx: AudioContext;
  const lastTargetTime = new Map<string, number>(); // tentacle별 마지막 재생 시각

  const myP = new p5((p: p5) => {
    //SETUP//
    //SETUP//
    //SETUP//
    //SETUP//
    p.setup = async () => {
      p.createCanvas(CANVAS, CANVAS, p.WEBGL, undefined);
      p.pixelDensity(1);
      sonarGfx = p.createGraphics(CANVAS, CANVAS);
      initArduino();

      // 우클릭 컨텍스트 메뉴 차단
      (p.canvas as HTMLCanvasElement).oncontextmenu = (e) => e.preventDefault();

      // checker init
      checker = checkerboard();

      //웹 소리 객체 init
      window.addEventListener(
        "click",
        () => {
          if (!audioCtx) audioCtx = new AudioContext();
        },
        { once: true }
      );

      noiseTex = await p.loadImage("/img/noiseTex.png");

      //img init
      initImages(p);

      //shader init
      const s = await shaderCobine();
      sketchShader = p.createShader(s.vertSrc, s.fragCombined);
    };

    //DRAW//
    //DRAW//
    //DRAW//
    //DRAW//
    p.draw = () => {
      if (!checker || !sketchShader || !noiseTex) return;
      p.clear();
      const tenUnique = tOccupied.filter((pos, i) => tOccupied.findIndex((q) => q[0] === pos[0] && q[1] === pos[1]) === i);
      const tenFlat = tenUnique.flatMap(([x, y]) => [x, y]);

      p.shader(sketchShader);
      sketchShader.setUniform("uResolution", [CANVAS, CANVAS]);
      sketchShader.setUniform("uGrid", GRID);
      sketchShader.setUniform("uNoise", noiseTex);
      sketchShader.setUniform("uSensorPos", sensorPos);
      sketchShader.setUniform("uSensorCount", vSensor.length);
      sketchShader.setUniform("uSegments", segFlat.slice(0, 400));
      sketchShader.setUniform("uSegmentCount", Math.min(conn.realSegCount, 50));
      sketchShader.setUniform("uTenOccupied", tenFlat.slice(0, 400));
      sketchShader.setUniform("uTenCount", Math.min(tenUnique.length, 200));

      p.noStroke();
      p.rect(-CANVAS / 2, -CANVAS / 2, CANVAS, CANVAS);
      p.resetShader();
      for (const v of vSensor) {
        for (const t of v.tentacles) {
          drawFABRIK(p, t);
        }
      }
    };

    p.mousePressed = (e: MouseEvent) => {
      if (!vSensor) return;
      if (p.mouseX < 0 || p.mouseX > CANVAS || p.mouseY < 0 || p.mouseY > CANVAS) return;

      const button = e?.button ?? 0;
      console.log("mousePressed button:", button, "p.mouseButton:", p.mouseButton);

      if (button === 2) {
        // 우클릭: sSensor에 랜덤 각도-거리 채우기
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

      // 피에조와 동일하게 accumulate에도 누적 (디버그용)
      const [cx, cy] = closest.checkerGrid.pos;
      updateAccumulate(vSensorAccumulate, cx, cy);
    };
  }, container);

  return myP;
}
