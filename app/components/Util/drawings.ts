import type p5 from "p5";
import { ImgSet, GRID, rows, cols } from "./types";

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
                    drawCircleCross(p, cellX, cellY);
                }
            }
        }
    }
}

export function drawCircleCross(p: p5, x: number, y: number) {

    p.fill(255, 0);
    p.stroke(0);
    p.strokeWeight(1);
    p.circle(x + GRID / 2, y + GRID / 2, GRID);
}

export function draw15line() {
    //이거해야됨 
}