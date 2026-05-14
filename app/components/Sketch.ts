import p5 from "p5";
import { CheckerGrid, VSensor } from "./Util/types";
import { GRID, CANVAS, TIME } from "./Util/constant";
import { fullGrid, checkerboard } from "./drawings/checkerboard";
import { initVSensor, updateDistStep, updateVSensor, updateConnection } from "./sensors/vSensor";
import { computePos4Shader, shaderCobine } from "./Util/shaderUtil";
import { drawFABRIK, initTentacle, tenOccupied, drawOccupiedMeta, drawOccupied } from "./drawings/tentacles";
import { buildTree, updateTree, drawTree, TreeSeg } from "./drawings/growTree";
import { playToneFromPos } from "./sensors/tSensor";

export function Sketch(container: HTMLElement) {
  let fg: CheckerGrid[];
  let checker: CheckerGrid[];
  let vSensor: VSensor[];
  let sketchShader: p5.Shader;
  let noiseTex: p5.Image;
  const units: p5.Image[] = [];
  const sensorPos: number[] = [];
  //아두이노
  const socket = new WebSocket("ws://localhost:8080");
  //웹 소리
  let audioCtx: AudioContext;
  const lastTargetTime = new Map<string, number>(); // tentacle별 마지막 재생 시각

  let tOccupied: [number, number][] = [];
  const endPointTrail: [number, number][] = [];
  let trees: TreeSeg[] = [];

  const myP = new p5((p: p5) => {
    //SETUP//
    //SETUP//
    //SETUP//
    //SETUP//
    p.setup = async () => {
      p.createCanvas(CANVAS, CANVAS, p.WEBGL);
      p.pixelDensity(1);

      // checker init
      checker = checkerboard();
      fg = fullGrid();

      // vsensor init
      vSensor = initVSensor(fg);

      //arduino init
      socket.onmessage = (event) => {
        const data = event.data.trim();
        const parts = data.split(":");
        const sensorId = parseInt(parts[0].replace("piezo", "")) - 1;
        const val = parseInt(parts[1]);

        //console.log("sensorId:", sensorId, "val:", val);

        if (vSensor[sensorId]) {
          vSensor[sensorId].strength = val;
        }
      };

      //웹 소리 객체 init
      window.addEventListener(
        "click",
        () => {
          if (!audioCtx) audioCtx = new AudioContext();
        },
        { once: true }
      );

      //tentacle init (1~2개)
      for (const v of vSensor) {
        const r = Math.floor(Math.random() * 2) + 1;
        v.tentacles = initTentacle(v, r, 100, 6);
        console.log(v.tentacles);
        sensorPos.push(v.checkerGrid.pos[0], v.checkerGrid.pos[1]);
      }
      while (sensorPos.length < 50) sensorPos.push(0);

      noiseTex = await p.loadImage("/img/noiseTex.png");

      // tree init - 시드 위치 몇 개 지정해서 자유 각도 트리 생성
      const seeds: [number, number][] = [
        [GRID * 2, 0],
        [GRID * 14, 0],
        [GRID * 26, 0],
      ];
      for (const seed of seeds) {
        trees = trees.concat(buildTree(seed, 6, GRID * 2.5, 8)); // 2 = 북쪽(위), depth 8
      }

      //img init
      fetch("/api/img")
        .then((res) => res.json())
        .then((urls: string[]) => {
          urls.forEach((url) => {
            p.loadImage(url, (loadedImg) => {
              units.push(loadedImg);
            });
          });
        });

      //shader init
      const s = await shaderCobine();
      sketchShader = p.createShader(s.vertSrc, s.fragCombined);
    };

    //DRAW//
    //DRAW//
    //DRAW//
    //DRAW//
    p.draw = () => {
      if (!checker || !vSensor || !sketchShader || !noiseTex) return;

      // vSensor 상태 업데이트
      updateVSensor(p, vSensor, checker, TIME);

      //연결점들 , segment float로 분리
      const [segFlat, endPoint] = updateConnection(vSensor, fg);
      tOccupied = tenOccupied(fg, vSensor);

      // 100개 segment = vec2 200개 = float 400개로 패딩
      const segCount = Math.min(segFlat.length / 4, 100);

      // 중복 제거
      const tenUnique = tOccupied.filter((pos, i) => tOccupied.findIndex((p) => p[0] === pos[0] && p[1] === pos[1]) === i);
      const tenFlat = tenUnique.flatMap(([x, y]) => [x, y]);

      // sensor 상태 추출해서 쉐이더에 보내기
      const sensorT: number[] = [];

      for (const v of vSensor) {
        sensorT.push(v.t);
      }

      // 셰이더 실행
      p.shader(sketchShader);
      //해상도
      sketchShader.setUniform("uResolution", [CANVAS, CANVAS]);
      //한 칸당 크기
      sketchShader.setUniform("uGrid", GRID);
      //텍스처
      sketchShader.setUniform("uNoise", noiseTex);
      //센서 위치, 센서 시간
      sketchShader.setUniform("uSensorPos", sensorPos);
      sketchShader.setUniform("uSensorT", sensorT.slice(0, 25));
      //센서 개수
      sketchShader.setUniform("uSensorCount", vSensor.length);
      //그려야 하는 선 개수
      sketchShader.setUniform("uSegments", segFlat.slice(0, 200)); // vec2 100개
      sketchShader.setUniform("uSegmentCount", Math.min(segFlat.length / 4, 100));
      //신호 보내는 점 위치
      while (endPoint.length < 2) endPoint.push(0);
      sketchShader.setUniform("uEndPoint", [endPoint[0], endPoint[1]]);

      //나머지 - 촉수 없는 위치 점
      sketchShader.setUniform("uTenOccupied", tenFlat.slice(0, 400)); // vec2 200개
      sketchShader.setUniform("uTenCount", Math.min(tenUnique.length, 200));

      // trail
      if (endPoint[0] !== 0 || endPoint[1] !== 0) {
        endPointTrail.unshift([endPoint[0], endPoint[1]]);
        if (endPointTrail.length > 50) endPointTrail.pop();
      }
      const trailFlat = endPointTrail.flatMap(([x, y]) => [x, y]);
      while (trailFlat.length < 100) trailFlat.push(0);
      sketchShader.setUniform("uTrail", trailFlat.slice(0, 100));
      sketchShader.setUniform("uTrailCount", endPointTrail.length);

      p.rect(-CANVAS / 2, -CANVAS / 2, CANVAS, CANVAS);
      p.resetShader();

      // 순비 이미지 그리기
      const nearImgs = updateDistStep(vSensor, units);
      console.log("그릴 이미지 개수:", nearImgs.length); // 조건 통과한 이미지 수

      for (const n of nearImgs) {
        for (const pos of n.pos) {
          const [x, y] = computePos4Shader(pos);
          p.image(n.image, x - GRID / 2, y - GRID / 2, GRID, GRID);
        }
      }

      // tree 업데이트 + 그리기 (occupied 침범하면 후퇴, 사라지면 재성장)
      updateTree(trees, tOccupied, 0.04, 0.08);
      drawTree(p, trees, 7);
      console.log("tenCount:", tenUnique.length); // draw() 안에서

      const STEP_DELAY = 0.15; // 음 사이 간격 (초)
      let stepIndex = 0; // 매 프레임 재생할 때 누적되는 인덱스

      for (const v of vSensor) {
        for (let i = 0; i < v.tentacles.length; i++) {
          const t = v.tentacles[i];
          drawFABRIK(p, t, TIME, endPoint);

          if (t.target && audioCtx) {
            const key = `${v.checkerGrid.pos[0]}_${v.checkerGrid.pos[1]}_${i}`;
            const now = Date.now();
            const last = lastTargetTime.get(key) || 0;

            if (now - last > 500) {
              // 순서대로 딜레이 누적
              playToneFromPos(audioCtx, t.target, stepIndex * STEP_DELAY);
              lastTargetTime.set(key, now);
              stepIndex++;
            }
          }
        }
      }
    };

    //EVENT//
    //EVENT//
    //EVENT//
    //EVENT//
    // p.mouseClicked = () => {
    //   if (!checker || !vSensor) return;

    //   const closest = snapToSensor(p, vSensor);
    //   console.log("closest:", closest.checkerGrid.pos);
    //   console.log("near:", closest.near);
    //   closest.clickCount++;
    //   closest.t = GRID * closest.clickCount;
    //   closest.connect = findOtherSensor(p, closest, vSensor, checker);
    //   p.loop();
    // };
  }, container);

  return myP;
}
