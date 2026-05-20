import p5 from "p5";
import { CheckerGrid, VSensor } from "./Util/types";
import { GRID, CANVAS, TIME } from "./Util/constant";
import { fullGrid, checkerboard } from "./drawings/checkerboard";
import { updateDistStep, updateVSensor, updateConnection, path2AndFilter } from "./sensors/vSensor";
import { initVSensorStore } from "./Util/vSensorStore";
import { computePos4Shader, shaderCobine } from "./Util/shaderUtil";
import { drawFABRIK, initTentacle, tenOccupied } from "./drawings/tentacles";
import { playToneFromPos } from "./sensors/tSensor";
import { sSensor, initSSensor, randomizeSSensor } from "./Util/sSensorStore";
import { drawSonarHalf, SONAR_R } from "./drawings/sonar";

export function Sketch(container: HTMLElement) {
  let fg: CheckerGrid[];
  let checker: CheckerGrid[];
  let vSensor: VSensor[];
  let sketchShader: p5.Shader;
  let noiseTex: p5.Image;
  let sonarGfx: p5.Graphics;
  const units: p5.Image[] = [];
  const sensorPos: number[] = [];
  //아두이노
  const socket = new WebSocket("ws://localhost:8080");
  //웹 소리
  let audioCtx: AudioContext;
  const lastTargetTime = new Map<string, number>(); // tentacle별 마지막 재생 시각

  let tOccupied: [number, number][] = [];
  const endPointTrail: [number, number][] = [];

  const myP = new p5((p: p5) => {
    //SETUP//
    //SETUP//
    //SETUP//
    //SETUP//
    p.setup = async () => {
      p.createCanvas(CANVAS, CANVAS, p.WEBGL);
      p.pixelDensity(1);
      sonarGfx = p.createGraphics(CANVAS, CANVAS);
      initSSensor();

      // 우클릭 컨텍스트 메뉴 차단
      (p.canvas as HTMLCanvasElement).oncontextmenu = (e) => e.preventDefault();

      // checker init
      checker = checkerboard();
      fg = fullGrid();

      // vsensor init (메인/unit 공유 store)
      vSensor = initVSensorStore(fg);

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

      p.background(0);

      // vSensor 상태 업데이트
      updateVSensor(p, vSensor, checker, TIME);

      //연결점들 , segment float로 분리
      const [segFlat, endPoint, realSegCount] = updateConnection(vSensor, fg);
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
      sketchShader.setUniform("uSegments", segFlat.slice(0, 400));
      sketchShader.setUniform("uSegmentCount", Math.min(realSegCount, 50));
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

      // 테두리
      p.noFill();
      p.stroke(255);
      p.strokeWeight(2);
      p.rect(-CANVAS / 2, -CANVAS / 2, CANVAS, CANVAS);

      // 소나 오버레이: P2D 버퍼에 그린 뒤 이미지로 합성
      sonarGfx.clear();
      sonarGfx.resetMatrix();
      sonarGfx.translate(CANVAS / 2, CANVAS / 2);
      sonarGfx.scale(CANVAS / (SONAR_R * 2));
      drawSonarHalf(sonarGfx as unknown as p5, sSensor, false);
      drawSonarHalf(sonarGfx as unknown as p5, sSensor, true);
      p.image(sonarGfx, -CANVAS / 2, -CANVAS / 2);

      // 순비 이미지 그리기
      const nearImgs = updateDistStep(vSensor, units);
      console.log("그릴 이미지 개수:", nearImgs.length); // 조건 통과한 이미지 수

      for (const n of nearImgs) {
        for (const pos of n.pos) {
          const [x, y] = computePos4Shader(pos);
          p.image(n.image, x - GRID / 2, y - GRID / 2, GRID, GRID);
        }
      }
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

    //MOUSE// — native event.button 으로 구분 (0=좌, 2=우)
    p.mousePressed = (e: MouseEvent) => {
      if (!vSensor) return;
      if (p.mouseX < 0 || p.mouseX > CANVAS || p.mouseY < 0 || p.mouseY > CANVAS) return;

      const button = e?.button ?? 0;
      console.log("mousePressed button:", button, "p.mouseButton:", p.mouseButton);

      if (button === 2) {
        // 우클릭: sSensor에 랜덤 각도-거리 채우기
        randomizeSSensor();
        return;
      }

      // 좌클릭: 가장 가까운 vSensor strength 증가
      let closest = vSensor[0];
      let minDist = Infinity;
      for (const v of vSensor) {
        const [x, y] = v.checkerGrid.pos;
        const d = p.dist(p.mouseX, p.mouseY, x, y);
        if (d < minDist) {
          minDist = d;
          closest = v;
        }
      }
      closest.strength += 100;
      closest.t = 60; // 활성화 시간 리셋

      // 클릭한 센서에서 주변 다른 센서로 connect 직접 생성 (trail 활성화)
      const threshold = GRID * 30;
      for (const other of vSensor) {
        if (other === closest) continue;
        const [ox, oy] = other.checkerGrid.pos;
        const [cx, cy] = closest.checkerGrid.pos;
        const d = p.dist(cx, cy, ox, oy);
        const prob = Math.max(0, 1 - d / threshold) ** 0.3;
        if (Math.random() > prob) continue;
        const from: [number, number] = [cx, cy];
        const to: [number, number] = [ox, oy];
        closest.connect.push({
          p1: from,
          p2: to,
          path: path2AndFilter(checker, from, to),
          t: 0,
          shrinking: false,
        });
      }
    };
  }, container);

  return myP;
}
