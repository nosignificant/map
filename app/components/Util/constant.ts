import { TreeParams } from "./types";

export const GRID = 40;
export const THRESHOLD = 35;
export const DISPLAY_SIZE = 200; //이미지 크기
export const CANVAS = GRID * 30;
export const MG = GRID / 2;
export const rows = CANVAS / GRID;
export const cols = CANVAS / GRID;

export const RIVER_STEP = 3;
export const DEFAULT_TREE: TreeParams = {
  len: 20,
  depth: 60,
  strokeW: 2,
  color: [0, 0, 0],
  spread: Math.PI / 4,
};

//CHECKER BOARD CENTER
export const CENTER = CANVAS / 2;
export const CORNER = [
  [0, 0],
  [0, CANVAS],
  [CANVAS / 2, 0],
  [0, CANVAS / 2],
  [CANVAS / 2, CANVAS],
  [CANVAS, CANVAS / 2],
  [CANVAS, 0],
  [CANVAS, CANVAS],
];
export const TIME = 0.2;
