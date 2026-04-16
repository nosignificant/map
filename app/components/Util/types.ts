import type p5 from "p5";

export type Placement = { x: number; y: number };

export type Pos = { x: number; y: number };
export type Grid = { ci: number; ri: number };

export type ImgSet = {
  img: p5.Image;
  edgeResult: EdgeResult;
  PlacedImage: PlacedImage[]; //클릭하면 추가됨
  corners: Corner[];
};

export type EdgeResult = {
  drawnPixel: boolean[][]; //이미지 영역이 차지하는 그리드
  outline: boolean[][]; // offset된거에서 drawPixel뺀부분
  grid: Grid;
};

export type PlacedImage = {
  pos: Pos;
  growthT: number;
  riverPaths: Pos[][];
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
