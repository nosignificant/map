// 유니티 MonoBehaviour 역할 — setup(), draw(), 이벤트
import type p5 from "p5";
import { getImg, MakeimgEdge, drawAllOccupied } from "./Util/image";
import { drawOutline } from "./Util/drawings";
import { buildRiverPath, drawRiverPath } from "./riverBranch";
import { GRID, DISPLAY_SIZE, CANVAS_W, CANVAS_H, ImgSet, PlacedImage } from "./Util/types";


const GROW_SPEED = 0.008;


export function createSketch(container: HTMLElement) {
  return (p: p5) => {
    //아웃라인, 차지하는 픽셀 정보 
    let set: ImgSet[] = [];

    //지금까지 저장된 모든 이미지 
    let occupied: boolean[][] = [];

    // 나무 그린 영역
    const treeOccupied: boolean[][] = Array.from(
      { length: CANVAS_H / GRID }, () => new Array(CANVAS_W / GRID).fill(false)
    );

    fetch("/api/images")
      .then((res) => res.json())
      .then((urls: string[]) => {

        const images: p5.Image[] = [];
        let loaded = 0;
        urls.forEach((url) => {

          //if (url.includes("특정문자열")) {
          //aImages.push(loadedImg); 

          p.loadImage(url, (loadedImg) => {
            images.push(loadedImg);
            loaded++;
            if (loaded === urls.length) {
              set = MakeimgEdge(p, images);
              p.redraw();
            }
          });
        });
      });

    // ── Start ────────────────────────────────────────────────────────────
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(CANVAS_W, CANVAS_H);
      p.noLoop();
    };

    function draw() {
      p.background(0);
      p.fill(255);
      p.stroke(0);
      p.strokeWeight(2);
      p.rect(0, 0, CANVAS_W, CANVAS_H);

      drawOutline(p, set, occupied);

      // 매 프레임 초기화
      for (let r = 0; r < treeOccupied.length; r++) treeOccupied[r].fill(false);

      for (const img of set) {
        for (const pl of img.placements) {
          p.image(img.img, pl.x, pl.y, DISPLAY_SIZE, DISPLAY_SIZE);
          for (const path of pl.riverPaths) {
            drawRiverPath(p, path, treeOccupied, pl.growthT);
          }
        }
      }
    }


    // ── p.draw ───────────────────────────────────────────────────────────
    p.draw = () => {
      let anyGrowing = false;
      for (const img of set) {
        for (const pl of img.placements) {
          if (pl.growthT < 1) {
            pl.growthT = Math.min(1, pl.growthT + GROW_SPEED);
            anyGrowing = true;
          }
        }
      }
      if (!anyGrowing) p.noLoop();
      draw();
    };

    // ── 이벤트 ───────────────────────────────────────────────────────────
    p.mouseClicked = () => {
      const img = getImg(set, 0);
      if (!img) return;
      if (p.mouseX < 0 || p.mouseX > CANVAS_W || p.mouseY < 0 || p.mouseY > CANVAS_H) return;

      const pl: PlacedImage = { x: p.mouseX - DISPLAY_SIZE / 2, y: p.mouseY - DISPLAY_SIZE / 2, growthT: 0, riverPaths: [] };
      const offsetMap = img.edgeResult.offsetMap;
      const STEP = 3;
      for (let ri = 0; ri < offsetMap.length; ri++) {
        for (let ci = 0; ci < offsetMap[0].length; ci++) {
          if (!offsetMap[ri][ci]) continue;
          if ((ri + ci) % STEP !== 0) continue;
          const cx = pl.x + (ci - 1) * GRID;
          const cy = pl.y + (ri - 1) * GRID;
          pl.riverPaths.push(buildRiverPath(cx, cy, occupied));
        }
      }
      img.placements.push(pl);
      occupied = drawAllOccupied(set);
      console.log("corners:", img.corners.length, img.corners);
      console.log("placements:", img.placements);
      p.loop();
    };

    p.keyPressed = () => {
      if (p.key === "r" || p.key === "R") {
        for (const img of set) img.placements = [];
        occupied = drawAllOccupied(set);
        p.redraw();
      }
    };
  };
}

