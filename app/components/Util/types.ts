import type p5 from "p5";

export type Placement = { x: number; y: number };

export const GRID = 10;
export const THRESHOLD = 35;
export const DISPLAY_SIZE = 200;
export const CANVAS_W = 1500;
export const CANVAS_H = 1000;
export const rows = CANVAS_H / GRID;
export const cols = CANVAS_W / GRID;

export type Pos = { x: number; y: number };

export type PlacedImage = {
  x: number;
  y: number;
  growthT: number;
  riverPaths: Pos[][];
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
