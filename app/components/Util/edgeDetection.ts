import type p5 from "p5";
import { EdgeResult } from "./types";
import { GRID, THRESHOLD, DISPLAY_SIZE } from "./constant";

// 엣지맵 팽창 → 끊긴 틈 메우기
export function dilate(
  src: boolean[][],
  rows: number,
  cols: number
): boolean[][] {
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
      if (src[ri][ci]) {
        out[ri][ci] = true;
        continue;
      }

      //ri, ci에 대해 모든 방향 검사
      for (const [dr, dc] of dirs) {
        const nr = ri + dr,
          nc = ci + dc;
        //검사 결과가 그리드 안에 있으면
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && src[nr][nc]) {
          out[ri][ci] = true;
          break;
        }
      }
    }
  }
  return out;
}

// 채워진 영역 바깥 1칸 테두리 추출
// 출력은 (rows+2) × (cols+2) — 이미지 경계 바깥 1칸도 포함
export function computeOffsetMap(
  dilateMap: boolean[][],
  drawnMap: boolean[][],
  rows: number,
  cols: number
): boolean[][] {
  const out = Array.from({ length: rows + 2 }, () =>
    new Array(cols + 2).fill(false)
  );

  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      out[ri + 1][ci + 1] = dilateMap[ri][ci] && !drawnMap[ri][ci];
    }
  }

  return out;
}

export function buildEdgeMap(p: p5, image: p5.Image): EdgeResult {
  const iw = DISPLAY_SIZE; // 가로 길이
  const ih = DISPLAY_SIZE; // 세로 길이

  const g = p.createGraphics(iw, ih);
  g.pixelDensity(1);
  g.image(image, 0, 0, iw, ih);
  g.loadPixels();

  const cols = Math.ceil(iw / GRID);
  const rows = Math.ceil(ih / GRID);
  const drawnPixel: boolean[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(false)
  );

  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      const x0 = ci * GRID;
      const y0 = ri * GRID;
      let sumAlpha: number = 0;

      for (let dy = 0; dy < GRID; dy += 2) {
        for (let dx = 0; dx < GRID && !drawnPixel[ri][ci]; dx += 2) {
          if (drawnPixel[ri][ci]) continue;
          const px = Math.min(x0 + dx, iw - 1);
          const py = Math.min(y0 + dy, ih - 1);
          const idx = (py * iw + px) * 4; // rgba가 4단위로 저장돼서 stride 4

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

  const closedEdge = dilate(drawnPixel, rows, cols);
  const offsetMap = computeOffsetMap(closedEdge, drawnPixel, rows, cols);

  return { drawnPixel, offsetMap, grid: { ci: rows, ri: cols } };
}
