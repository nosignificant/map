// 유니티 MonoBehaviour 역할 — setup(), draw(), 이벤트
import type p5 from "p5";
import { ImgSet, PlacedImage } from "./Util/types";
import { getImg, drawAllOccupied } from "./drawings/image";
import { MakeImgSet } from "./Util/edgeAndCorner";
import { drawOffsetOccupied } from "./drawings/drawings";
import { backGroundSetup, backGrid, backMiniGrid } from "./drawings/background";
import { buildRiverPath, markRiverOccupied, riverRect } from "./drawings/riverBranch";
import { drawTree } from "./drawings/proceduralTree";
import { GRID, DISPLAY_SIZE, CANVAS, DEFAULT_TREE, RIVER_STEP } from "./Util/constant";

const GROW_SPEED = 0.009;

export function createSketch(container: HTMLElement) {
  let set: ImgSet[] = [];

  //지금까지 저장된 모든 이미지
  let occupied: boolean[][] = [];

  // 나무 그린 영역
  const treeOccupied: boolean[][] = Array.from({ length: CANVAS / GRID }, () => new Array(CANVAS / GRID).fill(false));

  // 강 그린 영역
  const riverOccupied: boolean[][] = Array.from({ length: CANVAS / GRID }, () => new Array(CANVAS / GRID).fill(false));

  // 코너 나무 성장 t
  let cornerGrowthT = 0;
  const myP = (p: p5) => {
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
              set = MakeImgSet(p, images);
              p.redraw();
            }
          });
        });
      });

    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(CANVAS, CANVAS);
      p.loop(); // 코너 나무 바로 시작
    };

    function draw() {
      //나무 , 강 occupied 초기화
      for (let r = 0; r < treeOccupied.length; r++) treeOccupied[r].fill(false);
      for (let r = 0; r < riverOccupied.length; r++) riverOccupied[r].fill(false);

      // 1. 배경레이어
      backGroundSetup(p);

      // riverOccupied 미리 채우기 (그리기 전에)
      for (const img of set) {
        for (const pl of img.PlacedImage) {
          for (const path of pl.riverPaths) {
            markRiverOccupied(path, riverOccupied, pl.growthT);
          }
        }
      }

      // ── 레이어 2: river 네모 (제일 아래)
      riverRect(p, riverOccupied);

      // ── 레이어 3: 이미지 + river 선
      for (const img of set) {
        console.log("corners:", img.corners.length);
        for (const pl of img.PlacedImage) {
          p.image(img.img, pl.pos.x, pl.pos.y, DISPLAY_SIZE, DISPLAY_SIZE);

          for (const c of img.corners) {
            drawTree(
              p,
              { x: pl.pos.x + c.pos.x, y: pl.pos.y + c.pos.y }, // ← pl.pos 더하기
              c.angle,
              DEFAULT_TREE,
              occupied,
              treeOccupied,
              pl.growthT
            );
          }
        }
      }

      // ── 레이어 4: 아웃라인
      //drawOutline(p, set, occupied);
      drawOffsetOccupied(p, treeOccupied);
      backGrid(p);
      backMiniGrid(p);
    }

    // ── p.draw ───────────────────────────────────────────────────────────
    p.draw = () => {
      let anyGrowing = false;

      if (cornerGrowthT < 1) {
        cornerGrowthT = Math.min(1, cornerGrowthT + GROW_SPEED);
        anyGrowing = true;
      }

      for (const img of set) {
        for (const pl of img.PlacedImage) {
          if (pl.growthT < 1) {
            pl.growthT = Math.min(1, pl.growthT + GROW_SPEED);
            anyGrowing = true;
          }
        }
      }
      draw();
    };

    // ── 이벤트 ───────────────────────────────────────────────────────────
    p.mouseClicked = () => {
      //이미지 가져오는 로직 여기
      const img = getImg(set, 0);
      if (!img) return;
      if (p.mouseX < 0 || p.mouseX > CANVAS || p.mouseY < 0 || p.mouseY > CANVAS) return;

      const pl: PlacedImage = {
        pos: {
          //이미지 왼쪽 위 귀퉁이 좌표
          x: p.mouseX - DISPLAY_SIZE / 2,
          y: p.mouseY - DISPLAY_SIZE / 2,
        },
        growthT: 0,
        riverPaths: [],
      };
      //외곽 테두리
      const outline = img.edgeResult.outline;
      for (let ri = 0; ri < outline.length; ri++) {
        for (let ci = 0; ci < outline[0].length; ci++) {
          if (!outline[ri][ci]) continue; //bool 이라서 false면 안 그림
          if ((ri + ci) % RIVER_STEP !== 0) continue; // 3칸마다 하나그림

          const cx = pl.pos.x + ci * GRID;
          const cy = pl.pos.y + ri * GRID;
          pl.riverPaths.push(buildRiverPath(cx, cy, occupied));
        }
      }
      img.PlacedImage.push(pl);
      occupied = drawAllOccupied(set);
      p.loop();
    };

    p.keyPressed = () => {
      if (p.key === "r" || p.key === "R") {
        for (const img of set) img.PlacedImage = [];
        occupied = drawAllOccupied(set);
        p.redraw();
      }
    };
  };
  return myP;
}
