import type p5 from "p5";
import { ImgSet } from "./types";
import { GRID, CANVAS_W, CANVAS_H, rows, cols } from "./constant";
import { dilate } from "./edgeAndCorner";

export function drawOutline(p: p5, set: ImgSet[], occupied: boolean[][]) {
  p.fill(0);
  p.noStroke();

  for (const img of set) {
    const offsetMap = img.edgeResult.outline;

    for (const pl of img.PlacedImage) {
      for (let ri = 0; ri < offsetMap.length; ri++) {
        for (let ci = 0; ci < offsetMap[0].length; ci++) {
          if (!offsetMap[ri][ci]) continue; // 테두리 셀만

          const cellX = pl.pos.x + (ci - 1) * GRID;
          const cellY = pl.pos.y + (ri - 1) * GRID;

          const outRow = Math.floor(cellY / GRID);
          const outCol = Math.floor(cellX / GRID);
          if (occupied[outRow]?.[outCol]) continue;
          //drawCircleCross(p, cellX, cellY);
        }
      }
    }
  }
}

export function backGrid(p: p5) {
  const split = 5;

  const spacingH = CANVAS_H / split;
  const spacingW = CANVAS_W / split;
  for (let i = 0; i < split; i++) {
    const x = spacingW * i + spacingW;
    const y = spacingH * i + spacingH;

    p.strokeWeight(1);
    p.stroke(0, 0, 255);

    p.line(x, 0, x, CANVAS_H);
    p.line(0, y, CANVAS_W, y);
  }

  for (let row = 0; row < split; row++) {
    for (let col = 0; col < split; col++) {
      const cx = spacingW * (col + 1);
      const cy = spacingH * (row + 1);
      p.circle(cx, cy, 5);
    }
  }
}

export function backMiniGrid(p: p5) {
  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      const x = ci * GRID;
      const y = ri * GRID;

      p.strokeWeight(0);
      p.fill(100, 100, 100);
      p.circle(x, y, 2);
    }
  }
}

export function drawCircleCross(p: p5, x: number, y: number) {
  p.fill(255, 0);
  p.stroke(0);
  p.strokeWeight(1);
  p.circle(x, y, GRID);
}
export function backGroundSetup(p: p5) {
  p.fill(255, 255, 255);
  p.stroke(0);
  p.strokeWeight(2);
  p.rect(0, 0, CANVAS_W, CANVAS_H);
}
export function drawOffsetOccupied(p: p5, src: boolean[][]) {
  const dil = dilate(src);

  p.stroke(255, 0, 0);
  p.strokeWeight(1);
  p.noFill();

  for (let r = 0; r < dil.length; r++) {
    for (let c = 0; c < dil[r].length; c++) {
      if (!dil[r][c]) continue; // dil 셀만

      const x = c * GRID;
      const y = r * GRID;

      // dil 바깥 면에 선
      if (!dil[r - 1]?.[c]) p.line(x, y, x + GRID, y);
      if (!dil[r + 1]?.[c]) p.line(x, y + GRID, x + GRID, y + GRID);
      if (!dil[r]?.[c - 1]) p.line(x, y, x, y + GRID);
      if (!dil[r]?.[c + 1]) p.line(x + GRID, y, x + GRID, y + GRID);
    }
  }
}
