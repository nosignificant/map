import { ImgSet } from "./types";
import { GRID, rows, cols } from "./constant";

export function getImg(images: ImgSet[], force: number): ImgSet {
  //여기에 아두이노 연결했을 때 로직 넣기
  return images[force];
}

export function drawAllOccupied(set: ImgSet[]): boolean[][] {
  const out = Array.from({ length: rows }, () => new Array(cols).fill(false));

  for (const img of set) {
    const imgRows = img.edgeResult.drawnPixel.length;
    const imgCols = img.edgeResult.drawnPixel[0]?.length ?? 0;

    for (const pl of img.PlacedImage) {
      // 픽셀 좌표 → 그리드 인덱스
      const startRow = Math.floor(pl.pos.y / GRID);
      const startCol = Math.floor(pl.pos.x / GRID);

      for (let ri = 0; ri < imgRows; ri++) {
        for (let ci = 0; ci < imgCols; ci++) {
          const outRow = startRow + ri;
          const outCol = startCol + ci;
          if (outRow < 0 || outRow >= rows || outCol < 0 || outCol >= cols) continue;
          out[outRow][outCol] ||= img.edgeResult.drawnPixel[ri][ci];
        }
      }
    }
  }

  return out;
}
