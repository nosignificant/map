//지금 화면에 나오는 촉수들 위치 자체가 전체를 나타내는 거니까 지금 거만 기록해서 쓰면 되지 않을까

const MAX = 15;

const currentVtenPos: [number, number][] = [];

const currentVtenPos: [number, number][] = [];

export function reportCurrent(x: number, y: number) {
  if (currentVtenPos.length > 15) currentVtenPos.splice(0, 1);
  currentVtenPos.push([x, y]);
}
