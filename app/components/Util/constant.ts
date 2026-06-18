export const GRID = 40;
export const THRESHOLD = 35;
export const DISPLAY_SIZE = 200; //이미지 크기
export const CANVAS = GRID * 30;
export const MG = GRID / 2;
export const rows = CANVAS / GRID;
export const cols = CANVAS / GRID;

export const STEP_OFFSETS: [number, number][][] = [
  [[0, 0]], // 1단계
  [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ], // 2단계: 십자
  [
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1],
  ], // 3단계: 대각
  [
    [0, -2],
    [0, 2],
    [-2, 0],
    [2, 0],
  ], // 4단계: 십자 2칸
  [
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
    [-1, -2],
    [-1, 2],
    [-2, -1],
    [-2, 1],
  ], // 5단계
  [
    [0, -3],
    [0, 3],
    [-3, 0],
    [3, 0], // 십자 3칸
    [2, 2],
    [2, -2],
    [-2, 2],
    [-2, -2], // 대각 2칸
  ], // 6단계
];
//time
export const INITtime = 60;
export const TIME = 1.0;

export const TRAIL_SPEED = 1.0;

export const IMAGE_HISTORY_MAX = 10;
