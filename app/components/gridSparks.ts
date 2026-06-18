import p5 from "p5";
import { CheckerGrid, VSensor } from "./Util/types";
import { computePos4Shader } from "./Util/shaderUtil";
import { drawCross } from "./drawings/draw";
import { addConnection } from "./connections";

// fineGrid 전체 격자점에 십자를 깔고, 색(밝기)을 랜덤으로.
// 어두운 색 확률이 높게(대부분 어둑, 가끔 밝음). 가끔 vSensor와 흰 connection.

type Cell = { pos: [number, number]; gray: number };

let cells: Cell[] = [];
let built = false;

const CROSS_LEN = 8; // 십자 크기
const TWINKLE = 0.02; // 매 프레임 색 다시 뽑힐 셀 비율(반짝임)
const CONNECT_CHANCE = 0.04; // 매 프레임 vSensor 연결 확률
const WHITE: [number, number, number] = [255, 255, 255];

// 어두운 색 확률이 높은 밝기 (0~255). 지수 클수록 더 어두워짐
function randGray(): number {
  return Math.floor(255 * Math.pow(Math.random(), 3));
}

export function updateGridSparks(grid: CheckerGrid[], vSensor: VSensor[]) {
  // 격자점마다 십자 1개 (최초 1회 생성)
  if (!built && grid.length) {
    cells = grid.map((c) => ({ pos: [c.pos[0], c.pos[1]] as [number, number], gray: randGray() }));
    built = true;
  }

  // 반짝임: 일부 셀 색 재추첨
  for (const c of cells) {
    if (Math.random() < TWINKLE) c.gray = randGray();
  }

  // 가끔 밝은 셀 하나가 활성 vSensor와 흰 connection
  if (Math.random() < CONNECT_CHANCE && cells.length) {
    const active = vSensor.filter((v) => v.t > 0);
    if (active.length) {
      const c = cells[Math.floor(Math.random() * cells.length)];
      const v = active[Math.floor(Math.random() * active.length)];
      addConnection(c.pos, v.checkerGrid.pos, grid, WHITE);
    }
  }
}

// WEBGL 메인에서 그림
export function drawGridSparks(p: p5) {
  p.noFill();
  p.strokeWeight(1);
  for (const c of cells) {
    p.stroke(c.gray);
    const [x, y] = computePos4Shader(c.pos);
    drawCross(p, x, y, CROSS_LEN);
  }
}
