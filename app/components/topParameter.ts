import p5 from "p5";
import { CheckerGrid, VSensor } from "./Util/types";
import { GRID, CANVAS, TIME } from "./Util/constant";
import { fullGrid, checkerboard } from "./drawings/checkerboard";
import { initVSensor, updateDistStep, updateVSensor, updateConnection } from "./sensors/vSensor";
import { computePos4Shader, shaderCobine } from "./Util/shaderUtil";
import { drawFABRIK, initTentacle, tenOccupied } from "./drawings/tentacles";
import { playToneFromPos } from "./sensors/tSensor";

export function topParameter(container: HTMLElement, vSensor: VSensor[], fullGrid: CheckerGrid[], units: p5.Image[]) {
  const myP = new p5((p: p5) => {
    //SETUP//
    //SETUP//
    //SETUP//
    //SETUP//
    p.setup = async () => {
      p.createCanvas(CANVAS, CANVAS / 10, p.WEBGL);
      p.pixelDensity(1);
    };

    //DRAW//
    //DRAW//
    //DRAW//
    //DRAW//
    p.draw = () => {};
  }, container);

  return myP;
}

function drawRuler(p: p5, fullGrid: CheckerGrid[]) {
  //start and end
  p.line(0, 0, 0, CANVAS / 10);
  p.line(CANVAS, 0, CANVAS, CANVAS / 10);

  for (const fg of fullGrid) {
    const [x, y] = fg.pos;
    const modifyX = x + GRID / 2;
    const modifyY = y + GRID / 2;
  }
}
