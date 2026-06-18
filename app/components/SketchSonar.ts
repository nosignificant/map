import p5 from "p5";
import { Ssensor1, Ssensor2, sSensor1Accumulate, sSensor2Accumulate } from "./Arduino";
import { CANVAS, GRID } from "./Util/constant";
import { drawCross } from "./drawings/draw";
import { SLOT_DEG } from "./sensors/sSensor";

const SONAR_IMG_SIZE = 500;
const FAR_CM = 300; // 이 거리(cm) 이상이면 블러 시작
const FAR_BLUR_MIN = 3; // 405cm에서의 블러(px)
const FAR_BLUR_MAX = 25; // 600cm에서의 블러(px)
const FAR_ALPHA_MAX = 200; // 405cm에서의 alpha (0~255)
const FAR_ALPHA_MIN = 80; // 600cm에서의 alpha (멀수록 더 투명)

function slotAngle(angle: number) {
  return Math.round(angle / SLOT_DEG) * SLOT_DEG;
}

// 거리(cm) → 블러 반경(px), 405cm 미만은 0
function blurRadiusFor(dist: number): number {
  if (dist < FAR_CM) return 0;
  const k = Math.min((dist - FAR_CM) / (600 - FAR_CM), 1);
  return Math.round(FAR_BLUR_MIN + k * (FAR_BLUR_MAX - FAR_BLUR_MIN));
}

// 블러된 이미지 캐시: 이미지별 → (반경 → Graphics)
const blurCache = new WeakMap<p5.Image, Map<number, p5.Graphics>>();

function getBlurred(p: p5, img: p5.Image, radius: number): p5.Graphics {
  let perImg = blurCache.get(img);
  if (!perImg) {
    perImg = new Map();
    blurCache.set(img, perImg);
  }
  let g = perImg.get(radius);
  if (!g) {
    g = p.createGraphics(SONAR_IMG_SIZE, SONAR_IMG_SIZE);
    g.clear();
    g.image(img, 0, 0, SONAR_IMG_SIZE, SONAR_IMG_SIZE);
    g.filter(p.BLUR, radius); // p5 자체 블러 (버전 무관하게 동작)
    perImg.set(radius, g);
  }
  return g;
}

export function SketchSonar(container: HTMLElement) {
  const myP = new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(CANVAS, CANVAS);
      p.pixelDensity(1);
    };

    p.draw = () => {
      p.clear();
      p.translate(CANVAS / 2, CANVAS / 2);

      // 각도별 freq 가중 평균 위치에 원(주황) + 십자(파랑) — 각도당 1개
      const byAngle = new Map<number, { x: number; y: number; w: number }>();
      for (const a of [...sSensor1Accumulate, ...sSensor2Accumulate]) {
        const angle = slotAngle(a.angle);
        const m = byAngle.get(angle) ?? { x: 0, y: 0, w: 0 };
        m.x += a.pos[0] * a.freq;
        m.y += a.pos[1] * a.freq;
        m.w += a.freq;
        byAngle.set(angle, m);
      }
      for (const m of byAngle.values()) {
        if (m.w === 0) continue;
        const x = m.x / m.w;
        const y = m.y / m.w;
        p.noStroke();
        p.fill(255); // 흰 원
        p.circle(x, y, GRID * 0.7);
        p.stroke(0); // 검은 십자
        p.strokeWeight(2);
        drawCross(p, x, y);
      }

      // 고정 슬롯 이미지 (측정 안 된 슬롯은 imgSet null이라 스킵)
      p.noStroke();
      for (const i of [...Ssensor1, ...Ssensor2]) {
        if (!i.imgSet) continue;
        const ox = i.pos[0] - SONAR_IMG_SIZE / 2;
        const oy = i.pos[1] - SONAR_IMG_SIZE / 2;
        const radius = blurRadiusFor(i.dist);
        if (radius > 0) {
          // 먼 거리: 블러 + alpha 낮춤 (멀수록 더 투명)
          const k = Math.min((i.dist - FAR_CM) / (600 - FAR_CM), 1); // 405→0, 600→1
          p.tint(255, FAR_ALPHA_MAX - k * (FAR_ALPHA_MAX - FAR_ALPHA_MIN));
          p.image(getBlurred(p, i.imgSet.img, radius), ox, oy);
          p.noTint();
        } else {
          p.image(i.imgSet.img, ox, oy, SONAR_IMG_SIZE, SONAR_IMG_SIZE);
        }
      }
    };
  }, container);

  return myP;
}
