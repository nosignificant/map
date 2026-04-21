import { TreeParams, Corner } from "./types";

export const GRID = 40;
export const THRESHOLD = 35;
export const DISPLAY_SIZE = 200; //이미지 크기
export const CANVAS_W = GRID * 30 + GRID;
export const CANVAS_H = GRID * 30 + GRID;
export const rows = CANVAS_H / GRID;
export const cols = CANVAS_W / GRID;

export const RIVER_STEP = 3;
export const screenCorners: Corner[] = [
  { pos: { x: 0, y: 0 }, angle: Math.PI / 4 },
  { pos: { x: CANVAS_W - 1, y: 0 }, angle: (3 * Math.PI) / 4 },
  { pos: { x: 0, y: CANVAS_H - 1 }, angle: -Math.PI / 4 },
  { pos: { x: CANVAS_W - 1, y: CANVAS_H - 1 }, angle: (-3 * Math.PI) / 4 },
];
export const DEFAULT_TREE: TreeParams = {
  len: 20,
  depth: 60,
  strokeW: 2,
  color: [0, 0, 0],
  spread: Math.PI / 4,
};
