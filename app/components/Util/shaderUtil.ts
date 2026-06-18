import { CANVAS } from "./constant";

// WEBGL 중앙 원점 변환 (top-left → center-origin). 셰이더와 무관한 좌표 헬퍼.
export function computePos4Shader(pos: [number, number]): [number, number] {
  return [pos[0] - CANVAS / 2, pos[1] - CANVAS / 2];
}
