//지금 화면에 나오는 촉수들 위치 자체가 전체를 나타내는 거니까 지금 거만 기록해서 쓰면 되지 않을까

const MAX = 15;

export const currentVtenPos: [number, number][] = [];

export const currentStenPos: [number, number][] = [];

// vSensor 촉수 궤적
export function reportVten(x: number, y: number) {
  if (currentVtenPos.length >= MAX) currentVtenPos.shift();
  currentVtenPos.push([x, y]);
}

// sSensor 발 궤적
export function reportSten(x: number, y: number) {
  if (currentStenPos.length >= MAX) currentStenPos.shift();
  currentStenPos.push([x, y]);
}
