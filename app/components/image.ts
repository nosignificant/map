import type p5 from "p5";
import { buildEdgeMap } from "./edgeDetection";
import { ImgSet, GRID, rows, cols } from "./types";
import { findSimpleCorners } from "./cornerDetection";


export function MakeimgEdge(p: p5, images: p5.Image[]): ImgSet[] {
  const result: ImgSet[] = [];

  images.forEach((img) => {
    const edge = buildEdgeMap(p, img);
    result.push({ img: img, edgeResult: edge, placements: [], corners: findSimpleCorners(edge.offsetMap) });
  });

  return result;
}

export function getImg(images: ImgSet[], force: number): ImgSet {
  //여기에 아두이노 연결했을 때 로직 넣기
  return images[force];
}

export function drawAllOccupied(set: ImgSet[]): boolean[][] {
  const out = Array.from({ length: rows }, () => new Array(cols).fill(false));

  for (const img of set) {
    const imgRows = img.edgeResult.drawnPixel.length;
    const imgCols = img.edgeResult.drawnPixel[0]?.length ?? 0;

    for (const pl of img.placements) {
      // 픽셀 좌표 → 그리드 인덱스
      const startRow = Math.floor(pl.y / GRID);
      const startCol = Math.floor(pl.x / GRID);

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

export function drawOutline(p: p5, set: ImgSet[], occupied: boolean[][]) {
  p.fill(0);
  p.noStroke();

  for (const img of set) {
    const offsetMap = img.edgeResult.offsetMap;

    for (const pl of img.placements) {
      for (let ri = 0; ri < offsetMap.length; ri++) {
        for (let ci = 0; ci < offsetMap[0].length; ci++) {
          if (!offsetMap[ri][ci]) continue;  // 테두리 셀만

          const cellX = pl.x + (ci - 1) * GRID;
          const cellY = pl.y + (ri - 1) * GRID;

          const outRow = Math.floor(cellY / GRID);
          const outCol = Math.floor(cellX / GRID);
          if (occupied[outRow]?.[outCol]) continue;

          p.rect(cellX, cellY, GRID, GRID);
        }
      }
    }
  }
}
