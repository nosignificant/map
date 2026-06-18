import p5 from "p5";
import { CANVAS } from "./Util/constant";
import { checkerboard } from "./drawings/checkerboard";
import { vSensor, randomizeSSensor, initArduino, vSensorAccumulate, updateVsensorAccumulate } from "./Arduino";
import { applyStrength } from "./sensors/vSensor";
import { initImages } from "./Util/imageStore";
import { drawBoids } from "./boids";
import { drawConnections } from "./connections";
import { drawGridSparks } from "./gridSparks";
import { CheckerGrid } from "./Util/types";

export function Sketch(container: HTMLElement) {
  let checker: CheckerGrid[];

  const myP = new p5((p: p5) => {
    p.setup = async () => {
      p.createCanvas(CANVAS, CANVAS, p.WEBGL, undefined, { alpha: true });
      p.pixelDensity(1);
      initArduino();

      (p.canvas as HTMLCanvasElement).oncontextmenu = (e) => e.preventDefault();
      checker = checkerboard();
      initImages(p);
    };

    p.draw = () => {
      if (!checker) return;
      p.clear();

      drawGridSparks(p);
      drawConnections(p);
      drawBoids(p);
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
      // 강한 신호처럼 applyStrength로 (강할수록 stage·t·검색 세팅)
      applyStrength(closest, closest.t + 300);

      const [cx, cy] = closest.checkerGrid.pos;
      updateVsensorAccumulate(vSensorAccumulate, cx, cy);
    };
  }, container);

  return myP;
}
