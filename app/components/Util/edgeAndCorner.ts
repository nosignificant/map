import type p5 from "p5";
import { EdgeResult, ImgSet, Corner } from "./types";
import { GRID, THRESHOLD, DISPLAY_SIZE } from "./constant";

export function MakeImgSet(p: p5, images: p5.Image[]): ImgSet[] {
  const result: ImgSet[] = [];

  images.forEach((img) => {
    const edge = buildEdgeMap(p, img);
    result.push({
      img: img,
      edgeResult: edge,
      PlacedImage: [],
      corners: findSimpleCorners(edge.outline),
    });
  });

  return result;
}

////
// edge
////

export function buildEdgeMap(p: p5, image: p5.Image): EdgeResult {
  const g = p.createGraphics(DISPLAY_SIZE, DISPLAY_SIZE);
  g.pixelDensity(1);
  g.image(image, 0, 0, DISPLAY_SIZE, DISPLAY_SIZE);
  g.loadPixels();

  const cols = Math.ceil(DISPLAY_SIZE / GRID);
  const rows = Math.ceil(DISPLAY_SIZE / GRID);

  // 이미지 영역이 차지하는 그리드
  const drawnPixel: boolean[][] = Array.from({ length: rows }, () => new Array(cols).fill(false));

  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      const x0 = ci * GRID;
      const y0 = ri * GRID;
      let sumAlpha: number = 0;

      for (let dy = 0; dy < GRID; dy += 2) {
        for (let dx = 0; dx < GRID && !drawnPixel[ri][ci]; dx += 2) {
          if (drawnPixel[ri][ci]) continue;
          const px = Math.min(x0 + dx, DISPLAY_SIZE - 1);
          const py = Math.min(y0 + dy, DISPLAY_SIZE - 1);
          const idx = (py * DISPLAY_SIZE + px) * 4; // rgba가 4단위로 저장돼서 stride 4

          sumAlpha += g.pixels[idx + 3];

          if (sumAlpha > THRESHOLD) {
            // 임계값 이상이면 있다고 침
            drawnPixel[ri][ci] = true;
          }
        }
      }
    }
  }

  g.remove();

  const closedEdge = dilate(drawnPixel);
  const outline = computeOffsetMap(closedEdge, drawnPixel);

  return { drawnPixel, outline, grid: { ri: rows, ci: cols } };
}

// 엣지맵 팽창 → 끊긴 틈 메우기
export function dilate(src: boolean[][]): boolean[][] {
  const rows = src.length;
  const cols = src[0]?.length ?? 0;
  const out = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      //이미 채워져있으면 건너뛰기
      if (src[ri]?.[ci]) {
        out[ri][ci] = true;
        continue;
      }

      //이웃이 true면 나도 true
      for (const [dr, dc] of dirs) {
        const nr = ri + dr,
          nc = ci + dc;
        //검사 결과가 그리드 안에 있으면
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && src[nr]?.[nc]) {
          out[ri][ci] = true;
          break;
        }
      }
    }
  }
  return out;
}

export function computeOffsetMap(dilateMap: boolean[][], drawnMap: boolean[][]): boolean[][] {
  const rows = dilateMap.length;
  const cols = dilateMap[0]?.length ?? 0;
  const out = Array.from({ length: rows }, () => new Array(cols).fill(false));

  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      out[ri][ci] = dilateMap[ri][ci] && !drawnMap[ri][ci];
    }
  }

  return out;
}

////
// corner
////

const CLUSTER_RADIUS = 1; // 이 반경 안에 다른 코너 있으면 클러스터로 간주

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
      const dirCount = [hasUp, hasDown, hasLeft, hasRight].filter(Boolean).length;
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
      const dist = Math.abs(other.pos.y / GRID - c.pos.y / GRID) + Math.abs(other.pos.x / GRID - c.pos.x / GRID);
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
function getCornerAngle(hasUp: boolean, hasDown: boolean, hasLeft: boolean, hasRight: boolean): number | null {
  // 테두리가 위+왼쪽에 있다 = 이 셀은 이미지 바깥쪽 오른쪽아래 코너
  // → 나무는 반대 방향(↘)으로 자라야 함
  if (hasUp && hasLeft) return Math.PI / 4; // ↘
  if (hasUp && hasRight) return (3 * Math.PI) / 4; // ↙
  if (hasDown && hasLeft) return -Math.PI / 4; // ↗
  if (hasDown && hasRight) return (-3 * Math.PI) / 4; // ↖
  return null;
}
