import p5 from "p5";

export type Grid = { ci: number; ri: number };

// check pattern
export type CheckerGrid = { grid: Grid; pos: [number, number] };
export type CheckerGridFreq = CheckerGrid & { freq: number };

export type VSensor = {
  name: string;
  checkerGrid: CheckerGrid;
  near: VsensorImagePos[];
  clickCount: number;
  connect: Connect[];
  strength: number;
  currentStage: number;
  t: number; // 이미지 stage 수명 (strength로 설정 → 매 프레임 감소 → stage·반경 줄어듦)
};

export type Ssensor = {
  angle: number;
  dir: -1 | 1;
  pos: [number, number]; // 현재 위치 (targetPos로 점진 이동)
  targetPos: [number, number]; // 측정 거리로 계산된 목표 위치
  imgSet: ImgSet | null;
  dist: number; // 마지막 측정 거리(cm) — 먼 거리 블러 판정용
};

export type ImgSet = { img: p5.Image; edgeResult: EdgeResult };

export type EdgeResult = {
  drawn: [number, number][]; // 이미지가 차지한 칸들
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
  switchInterval: number; // 전환 간격 (고정)
  speed: number;
  phase: number;
  curveBias: number; // baseline 휨 정도 (양수=한쪽, 음수=반대쪽)
  locked: boolean; // sSensor 발: vSensor/sSensor 찾으면 target 고정
  lockedSonar: boolean; // 다른 sSensor(sonar)에 연결됐는지
};

export type Vaccumulate = { pos: [number, number]; freq: number; lastFreq?: number };
export type Saccumulate = { pos: [number, number]; angle: number; band: number; freq: number };
export type Accumulate = { pos: [number, number]; freq: number };
