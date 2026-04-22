import { CheckerGrid } from "./types";
import { GRID } from "./constant";

export function findPath(src: CheckerGrid[], from: [number, number], to: [number, number]): [number, number][] {
  const paths: [number, number][] = [];
  const key = (x: number, y: number) => `${x},${y}`;

  //x, y로 맵에 저장
  const posMap = new Map<string, CheckerGrid>();
  for (const c of src) posMap.set(key(c.pos[0], c.pos[1]), c);

  const visited = new Set<string>();

  //시작점
  const queue: { pos: [number, number]; path: [number, number][] }[] = [{ pos: from, path: [from] }];

  while (queue.length > 0) {
    //큐에서 하나 꺼냄
    const { pos, path } = queue.shift()!;
    //위치를 문자열로 변형
    const k = key(pos[0], pos[1]);
    //방문한 적있으면 건너뜀
    if (visited.has(k)) continue;
    visited.add(k);

    if (pos[0] === to[0] && pos[1] === to[1]) return path;

    // 인접한 체커 칸 찾기 (대각선 포함)
    const dirs = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
    ];
    for (const [dr, dc] of dirs) {
      //이웃 점을 큐에 추가
      const nx = pos[0] + dc * GRID;
      const ny = pos[1] + dr * GRID;
      const nk = key(nx, ny);
      if (posMap.has(nk) && !visited.has(nk)) {
        queue.push({ pos: [nx, ny], path: [...path, [nx, ny]] });
      }
    }
  }

  return []; // 경로 없음
}
