import { Corner } from "./types";
import { GRID } from "./constant";

const CLUSTER_RADIUS = 3; // 이 반경 안에 다른 코너 있으면 클러스터로 간주

// offsetMap에서 단순 코너(① O, ② X) 목록 반환
export function findSimpleCorners(offsetMap: boolean[][]): Corner[] {
  const rows = offsetMap.length;
  const cols = offsetMap[0]?.length ?? 0;

  const isBorder = (r: number, c: number): boolean => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    return offsetMap[r][c];
  };

  const candidates: Corner[] = [];

  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      if (!offsetMap[ri][ci]) continue; // 테두리 셀만 검사

      const hasUp = isBorder(ri - 1, ci) || isBorder(ri - 2, ci);
      const hasDown = isBorder(ri + 1, ci) || isBorder(ri + 2, ci);
      const hasLeft = isBorder(ri, ci - 1) || isBorder(ri, ci - 2);
      const hasRight = isBorder(ri, ci + 1) || isBorder(ri, ci + 2);

      // 수직 방향(상하) + 수평 방향(좌우) 동시에 있어야 코너
      const isCorner = (hasUp || hasDown) && (hasLeft || hasRight);
      if (!isCorner) continue;

      // T자/십자(방향이 3개 이상)는 단순 코너가 아니므로 제외
      const dirCount = [hasUp, hasDown, hasLeft, hasRight].filter(
        Boolean
      ).length;
      if (dirCount > 2) continue;

      // 대각선 방향 결정 (코너가 향하는 바깥쪽)
      const angle = getCornerAngle(hasUp, hasDown, hasLeft, hasRight);
      if (angle === null) continue;

      candidates.push({ pos: { x: ci * GRID, y: ri * GRID }, angle });
    }
  }

  return candidates.filter((c) => {
    const hasNearby = candidates.some((other) => {
      if (other === c) return false;
      const dist =
        Math.abs(other.pos.y / GRID - c.pos.y / GRID) +
        Math.abs(other.pos.x / GRID - c.pos.x / GRID);
      return dist <= CLUSTER_RADIUS;
    });
    return !hasNearby; // 근처에 없는 것 = 단순 코너만 통과
  });
}

// 코너 방향에 따른 대각선 각도 반환
// 이미지 바깥쪽으로 향하는 방향
//
//  hasUp + hasLeft  → ↖ 왼쪽 위
//  hasUp + hasRight → ↗ 오른쪽 위
//  hasDown + hasLeft  → ↙ 왼쪽 아래
//  hasDown + hasRight → ↘ 오른쪽 아래
function getCornerAngle(
  hasUp: boolean,
  hasDown: boolean,
  hasLeft: boolean,
  hasRight: boolean
): number | null {
  // 테두리가 위+왼쪽에 있다 = 이 셀은 이미지 바깥쪽 오른쪽아래 코너
  // → 나무는 반대 방향(↘)으로 자라야 함
  if (hasUp && hasLeft) return Math.PI / 4; // ↘
  if (hasUp && hasRight) return (3 * Math.PI) / 4; // ↙
  if (hasDown && hasLeft) return -Math.PI / 4; // ↗
  if (hasDown && hasRight) return (-3 * Math.PI) / 4; // ↖
  return null;
}
