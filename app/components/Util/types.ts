import p5 from "p5";

export type Pos = { x: number; y: number };
export type Grid = { ci: number; ri: number };

// check pattern
export type CheckerGrid = { grid: Grid; pos: [number, number] };
export type CheckerGridFreq = CheckerGrid & { freq: number };

//마우스 지정한 blackboard 중심지마다 n초씩 추가해서 강도 강하게 원그리기? - 시간 지나면 원 줄어들게 하기?
export type VSensor = {
  checkerGrid: CheckerGrid;
  near: CheckerDistStep[];
  clickCount: number;
  t: number;
  connect: Connect[];
  tentacles: Tentacle[];
  tenTarget: [number, number] | null;
  strength: number;
};

// Sonar sensor — 각도와 거리 한 쌍 (vSensor와 비슷한 형식의 배열로 보관)
export type SSensor = {
  angle: number;
  distance: number;
  t: number;
};

//T sensor images
export type CheckerDistStep = {
  pos: [number, number][];
  image: p5.Image;
  stage: number;
};
export type Connect = {
  p1: [number, number];
  p2: [number, number];
  path: [number, number][];
  t: number;
  shrinking: boolean;
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
  angle: number;
  isFollowing: boolean;
  speed: number;
  phase: number;
  curveBias: number; // baseline 휨 정도 (양수=한쪽, 음수=반대쪽)
};
