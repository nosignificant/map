import p5 from "p5";
import { VSensor, CheckerGrid } from "./Util/types";
import { computePos4Shader } from "./Util/shaderUtil";
import { GRID, CANVAS } from "./Util/constant";
import { ULTRA } from "./drawings/checkerboard";
import { addConnection } from "./connections";
import { drawCross } from "./drawings/draw";

export type Boid = {
  pos: [number, number];
  vel: [number, number];
  color: [number, number, number];
  origin: [number, number]; // 연결 시작점
  colored: boolean; // true=2차 색 boid, false=중심 베이스
  cooldown: number; // 연결 후 재연결 대기
  t: number; // 수명 (colored만 사용)
  seek: number; // 개체별 끌림
  sep: number; // 개체별 분리
  sepR: number; // 개체별 분리 반경
  push: number; // 개체별 중심 밀어내는 힘 (색 boid)
  speed: number; // 개체별 최고 속도
};

export const boids: Boid[] = [];
// base boid끼리 격자 경로 (매 프레임 갱신, live)
export const baseLinks: [number, number][][] = [];

const BASE_COUNT = 30; // 중심 베이스 boid 수
const MAX_BOIDS = 120; // 전체 상한
const MAX_SPEED = 4;
const DAMP = 0.9; // 속도 감쇠 (관성, 부드러운 움직임)
const SEEK = 0.5; // 활성 vSensor로 이끌림 (기준)
const SEP = 1.5; // 분리 (기준)
const SEP_R = 40;

const rnd = (min: number, max: number) => min + Math.random() * (max - min);
// 개체별 특성 (기준값 ±변동)
const randTraits = () => ({
  seek: SEEK * rnd(0.6, 1.4),
  sep: SEP * rnd(0.6, 1.4),
  sepR: SEP_R * rnd(0.7, 1.3),
  push: CENTER_PUSH * rnd(0.4, 10.0),
  speed: MAX_SPEED * rnd(0.1, 7.0),
});
const CENTER_PULL = 0.02; // 베이스가 중심으로 복귀 (강하게)
const CENTER_PUSH = 1.5; // 색 boid가 중심에서 밀려나는 힘
const CENTER_PUSH_R = GRID * 6; // 이 반경 안이면 중심에서 밀어냄
const WANDER = 0.6; // 색 boid 배회 힘
const EDGE_MARGIN = GRID; // 캔버스 외곽 여유
const REACH = GRID * 2; // 닿음 판정
const COOLDOWN = 120; // 베이스 재연결 대기(프레임)
const COLORED_LIFE = 600; // 색 boid 수명
const SENSOR_ATTRACT = 0.8; // 활성 vSensor가 끌어당기는 힘
const LINK_COLOR: [number, number, number] = [255, 0, 0]; // vSensor끼리 연결되는 색(빨강)
const BASE_LINK_DIST = GRID * 3; // base끼리 경로 연결되는 거리

const center = (): [number, number] => [CANVAS / 2, CANVAS / 2];

// 중심에 베이스 boid 준비
export function createBoids() {
  if (boids.length > 0) return;
  for (let i = 0; i < BASE_COUNT; i++) {
    const a = Math.random() * Math.PI * 2;
    const [cx, cy] = center();
    boids.push({
      pos: [cx + Math.cos(a) * GRID, cy + Math.sin(a) * GRID],
      vel: [Math.cos(a) * 2, Math.sin(a) * 2],
      color: [255, 255, 255], // base는 색 미사용(검은 네모+흰 십자)
      origin: [cx, cy],
      colored: false,
      cooldown: 0,
      t: 0,
      ...randTraits(),
    });
  }
}

function spawnColored(pos: [number, number]) {
  if (boids.length >= MAX_BOIDS) return;
  const a = Math.random() * Math.PI * 2;
  boids.push({
    pos: [pos[0], pos[1]],
    vel: [Math.cos(a) * 2, Math.sin(a) * 2],
    color: LINK_COLOR,
    origin: [pos[0], pos[1]],
    colored: true,
    cooldown: 0,
    t: COLORED_LIFE,
    ...randTraits(),
  });
}

export function updateBoids(vSensor: VSensor[], fg: CheckerGrid[]) {
  const [cx, cy] = center();

  for (let i = boids.length - 1; i >= 0; i--) {
    const b = boids[i];

    let fx = 0;
    let fy = 0;

    // 분리(이웃 boid)
    for (const o of boids) {
      if (o === b) continue;
      const dx = b.pos[0] - o.pos[0];
      const dy = b.pos[1] - o.pos[1];
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < b.sepR) {
        fx += (dx / d) * b.sep;
        fy += (dy / d) * b.sep;
      }
    }

    // 가까운 활성 vSensor 찾기 + 인력 합산 (colored는 자기 출신 제외)
    let best: VSensor | null = null;
    let bd = Infinity;
    for (const v of vSensor) {
      if (v.t <= 0) continue;
      const [vx, vy] = v.checkerGrid.pos;
      if (b.colored && Math.hypot(vx - b.origin[0], vy - b.origin[1]) < REACH) continue; // 출신 제외
      const dx = vx - b.pos[0];
      const dy = vy - b.pos[1];
      const d = Math.hypot(dx, dy) || 1;
      if (d < bd) {
        bd = d;
        best = v;
      }
      if (!b.colored) {
        // 베이스: 모든 활성 vSensor가 끌어당김 — strength 클수록 강하게
        const w = Math.min(v.t / 300, 3); // strength(v.t) 비례 가중 (상한 3)
        fx += (dx / d) * SENSOR_ATTRACT * MAX_SPEED * w;
        fy += (dy / d) * SENSOR_ATTRACT * MAX_SPEED * w;
      }
    }

    if (b.colored && best) {
      const dx = best.checkerGrid.pos[0] - b.pos[0];
      const dy = best.checkerGrid.pos[1] - b.pos[1];
      const d = Math.hypot(dx, dy) || 1;
      fx += (dx / d) * b.seek * MAX_SPEED;
      fy += (dy / d) * b.seek * MAX_SPEED;
    }

    if (!b.colored) {
      // 베이스: 중심으로 강하게 끌림
      fx += (cx - b.pos[0]) * CENTER_PULL;
      fy += (cy - b.pos[1]) * CENTER_PULL;
    } else {
      // 색 boid: 중심에서 밀려남 + 배회
      const dxc = b.pos[0] - cx;
      const dyc = b.pos[1] - cy;
      const dc = Math.hypot(dxc, dyc) || 1;
      if (dc < CENTER_PUSH_R) {
        fx += (dxc / dc) * b.push * MAX_SPEED;
        fy += (dyc / dc) * b.push * MAX_SPEED;
      }
      fx += (Math.random() - 0.5) * WANDER;
      fy += (Math.random() - 0.5) * WANDER;
    }

    b.vel[0] = (b.vel[0] + fx) * DAMP; // 감쇠로 부드럽게 (관성)
    b.vel[1] = (b.vel[1] + fy) * DAMP;
    const sp = Math.hypot(b.vel[0], b.vel[1]);
    if (sp > b.speed) {
      b.vel[0] = (b.vel[0] / sp) * b.speed;
      b.vel[1] = (b.vel[1] / sp) * b.speed;
    }
    b.pos[0] += b.vel[0];
    b.pos[1] += b.vel[1];

    // 색 boid: 캔버스 밖으로 못 나가게 (튕김)
    if (b.colored) {
      if (b.pos[0] < EDGE_MARGIN) {
        b.pos[0] = EDGE_MARGIN;
        b.vel[0] = Math.abs(b.vel[0]);
      } else if (b.pos[0] > CANVAS - EDGE_MARGIN) {
        b.pos[0] = CANVAS - EDGE_MARGIN;
        b.vel[0] = -Math.abs(b.vel[0]);
      }
      if (b.pos[1] < EDGE_MARGIN) {
        b.pos[1] = EDGE_MARGIN;
        b.vel[1] = Math.abs(b.vel[1]);
      } else if (b.pos[1] > CANVAS - EDGE_MARGIN) {
        b.pos[1] = CANVAS - EDGE_MARGIN;
        b.vel[1] = -Math.abs(b.vel[1]);
      }
    }

    if (b.cooldown > 0) b.cooldown--;

    // 닿음 → 연결
    if (best && bd < REACH && b.cooldown <= 0) {
      const [vx, vy] = best.checkerGrid.pos;
      if (b.colored) {
        addConnection(b.origin, [vx, vy], fg, b.color); // 그 boid 색으로 연결
        boids.splice(i, 1);
        continue;
      } else {
        addConnection([cx, cy], [vx, vy], fg, [255, 255, 255]); // 중심→vSensor (흰선)
        spawnColored([vx, vy]); // vSensor가 색 boid 생성
        b.cooldown = COOLDOWN;
      }
    }

    // colored 수명
    if (b.colored) {
      b.t--;
      if (b.t <= 0) boids.splice(i, 1);
    }
  }

  // base boid: 중심 ~ 자기 + base끼리 격자 경로(live) — 매 프레임 갱신
  baseLinks.length = 0;
  for (let i = 0; i < boids.length; i++) {
    if (boids[i].colored) continue;
    // 중심 → base boid
    const cpath = gridStaircase([cx, cy], boids[i].pos);
    if (cpath.length > 1) baseLinks.push(cpath);
    // base끼리
    for (let j = i + 1; j < boids.length; j++) {
      if (boids[j].colored) continue;
      if (Math.hypot(boids[i].pos[0] - boids[j].pos[0], boids[i].pos[1] - boids[j].pos[1]) >= BASE_LINK_DIST) continue;
      const path = gridStaircase(boids[i].pos, boids[j].pos);
      if (path.length > 1) baseLinks.push(path);
    }
  }
}

// 두 점을 ULTRA 격자에 맞춰 계단형 경로로 잇기 (BFS 없이 O(거리))
function gridStaircase(from: [number, number], to: [number, number]): [number, number][] {
  const sn = (n: number) => Math.round(n / ULTRA) * ULTRA;
  let x = sn(from[0]);
  let y = sn(from[1]);
  const tx = sn(to[0]);
  const ty = sn(to[1]);
  const out: [number, number][] = [[x, y]];
  let guard = 0;
  while ((x !== tx || y !== ty) && guard++ < 500) {
    const dx = tx - x;
    const dy = ty - y;
    // x·y 번갈아 한 칸씩 (대각 계단)
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) x += Math.sign(dx) * ULTRA;
    else if (dy !== 0) y += Math.sign(dy) * ULTRA;
    else if (dx !== 0) x += Math.sign(dx) * ULTRA;
    out.push([x, y]);
  }
  return out;
}

// WEBGL 메인에서 그림
export function drawBoids(p: p5) {
  const D = 10;

  // base boid끼리 격자 경로 (live) — 흰선
  p.stroke(255);
  p.strokeWeight(1);
  p.noFill();
  for (const path of baseLinks) {
    for (let k = 0; k < path.length - 1; k++) {
      const [x1, y1] = computePos4Shader(path[k]);
      const [x2, y2] = computePos4Shader(path[k + 1]);
      p.line(x1, y1, x2, y2);
    }
  }

  for (const b of boids) {
    const [bx, by] = computePos4Shader(b.pos);
    if (b.colored) {
      // 색 boid(vSensor-vSensor): 채운 원 (connection과 같은 색)
      p.stroke(b.color[0], b.color[1], b.color[2]);
      p.fill(b.color[0], b.color[1], b.color[2]);
      //p.circle(bx, by, D);
      drawCross(p, bx, by);
    } else {
      // 베이스: 검은 배경 네모 + 흰 십자
      p.noStroke();
      p.fill(0);
      p.rect(bx - D / 2, by - D / 2, D, D);
      p.stroke(255);
      p.strokeWeight(2);
      drawCross(p, bx, by);
    }
  }
}
