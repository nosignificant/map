import type p5 from "p5";
import { THRESHOLD, DISPLAY_SIZE } from "./constant";
import { ImgSet, EdgeResult } from "../Util/types";

const GRID = 10;

// boolean[][] → true인 칸의 [ci, ri] 좌표 목록
function boolToCoords(map: boolean[][]): [number, number][] {
  const coords: [number, number][] = [];
  for (let ri = 0; ri < map.length; ri++) {
    for (let ci = 0; ci < map[ri].length; ci++) {
      if (map[ri][ci]) coords.push([ci, ri]);
    }
  }
  return coords;
}

export function MakeImgSet(p: p5, image: p5.Image): ImgSet {
  return { img: image, edgeResult: buildEdgeMap(p, image) };
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

  return {
    drawn: boolToCoords(closedEdge),
  };
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
