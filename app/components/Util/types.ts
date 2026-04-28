export type Pos = { x: number; y: number };
export type Grid = { ci: number; ri: number };

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
  near: CheckerDistStep[];
  clickCount: number;
  t: number;
  connect: Connect[];
  tentacles: Tentacle[];
};

//T sensor images
export type CheckerDistStep = {
  checkerGrid: CheckerGrid;
  distStep: number;
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
};
