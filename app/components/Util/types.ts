import type p5 from "p5";

export type Placement = { x: number; y: number };

export type Pos = { x: number; y: number };
export type Grid = { ci: number; ri: number };

export type PlacedImage = {
  pos: Pos;
  growthT: number;
  riverPaths: Pos[][];
};

export type EdgeResult = {
  drawnPixel: boolean[][];
  offsetMap: boolean[][];
  grid: Grid;
};

export type ImgSet = {
  img: p5.Image;
  edgeResult: EdgeResult;
  placements: PlacedImage[];
  corners: Corner[];
};

export type Corner = {
  pos: Pos;
  angle: number; // 대각선 방향 (라디안)
};

export type TreeParams = {
  len: number;
  depth: number;
  strokeW: number;
  color: [number, number, number];
  spread: number;
};
