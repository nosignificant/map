import p5 from "p5";

export type Grid = { ci: number; ri: number };

// check pattern
export type CheckerGrid = { grid: Grid; pos: [number, number] };
export type CheckerGridFreq = CheckerGrid & { freq: number };

export type VSensor = {
  checkerGrid: CheckerGrid;
  near: VsensorImagePos[];
  clickCount: number;
  connect: Connect[];
  tentacle: Tentacle;
  strength: number;
  currentStage: number;
};

export type Ssensor = {
  id: number;
  angle: number;
  distance: number;
  dir: number;
};

export type SsensorImagePos = {
  pos: [number, number];
  imgSet: ImgSet;
  tentacle: Tentacle;
  t: number;
};

export type ImgSet = { img: p5.Image; edgeResult: EdgeResult };

export type EdgeResult = {
  drawn: [number, number][]; // 이미지가 차지한 칸들
  outline: [number, number][]; // 외곽선 칸들
};

//T sensor images
export type VsensorImagePos = {
  pos: [number, number][];
  image: p5.Image;
  stage: number;
};
export type Connect = {
  path: [number, number][];
  t: number;
  alt: boolean;
};

export type Tentacle = {
  //몸이 시작되는 곳
  startPos: [number, number];
  //기본 길이랑 기본 위치
  defaultLength: number;
  defaultPos: [number, number];
  //몸 파츠들의 위치
  parts: [number, number][];
  target: [number, number] | null;
  t: number;
  switchT: number; // 다음 target 전환까지 남은 시간
  speed: number;
  phase: number;
  curveBias: number; // baseline 휨 정도 (양수=한쪽, 음수=반대쪽)
};

export type Vaccumulate = { pos: [number, number]; freq: number; lastFreq?: number };
export type Saccumulate = { pos: [number, number]; angle: number; dist: number; freq: number };
