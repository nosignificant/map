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

//svg morphing

export type Sign = {
  morphFn: MorphFn;
  grow: number;
  //cooldown은 숫자 입력한 거 다 까지면 shrink로 넘어감
  cooldown: number;
  maxCool: number;
  shrink: number;
  repeat: number;
};
export type MorphFn = (t: number) => [number, number][];

// check pattern
export type CheckerGrid = { grid: Grid; pos: [number, number] };

//마우스 지정한 blackboard 중심지마다 n초씩 추가해서 강도 강하게 원그리기? - 시간 지나면 원 줄어들게 하기?
export type VSensor = {
  checkerGrid: CheckerGrid;
  clickCount: number;
  t: number;
};
