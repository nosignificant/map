import type p5 from "p5";

export type Placement = { x: number; y: number };

export const GRID = 5;
export const THRESHOLD = 35;
export const DISPLAY_SIZE = 200;
export const CANVAS_W = 1920;
export const CANVAS_H = 1080;
export const rows = CANVAS_H / GRID;
export const cols = CANVAS_W / GRID;

export type RiverNode = { x: number; y: number };

export type PlacedImage = {
  x: number;
  y: number;
  growthT: number;
  riverPaths: RiverNode[][];  // 코너마다 경로
};

export type EdgeResult = {
  drawnPixel: boolean[][];
  offsetMap: boolean[][];
  rows: number;
  cols: number;
};

export type ImgSet = {
  img: p5.Image;
  edgeResult: EdgeResult;
  placements: PlacedImage[];
  corners: Corner[];
}

export type Corner = {
  ri: number;   // 행 인덱스
  ci: number;   // 열 인덱스
  angle: number; // 대각선 방향 (라디안)
};

export type TreeParams = {
  len: number;
  depth: number;
  strokeW: number;
  color: [number, number, number];
  spread: number;
};
