import { boids } from "../boids";
import { CANVAS } from "../Util/constant";

// base boid 위치(중심거리) → 지속음(드론)의 음정/음량
// 중심에 가까우면 낮고 조용, 멀수록 높고 커짐

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

type Voice = { osc: OscillatorNode; gain: GainNode };
const voices: Voice[] = [];
const MAX_VOICES = 10; // base boid 수만큼

const F_MIN = 160; // 중심에서의 음정(Hz)
const F_MAX = 760; // 외곽에서의 음정(Hz)
const V_MIN = 0.01; // 중심 음량
const V_MAX = 0.16; // 외곽 음량
const SMOOTH = 0.08; // 파라미터 보간 시간(초)

// ===== 터치 → 피치 상승 =====
const TOUCH_TIMEOUT = 400; // ms 이상 touch 없으면 "뗌"으로 판정 (아두이노가 0.2초마다 보냄)
const BOOST_MAX = 1; // 최대 피치 상승 (1 = 한 옥타브 위)
const BOOST_RISE = 0.04; // 터치 중 상승 속도 (프레임당, 순차적으로 올라감)
const BOOST_FALL = 0.03; // 터치 사라진 뒤 하강 속도

let touchTarget = 0; // 0 또는 BOOST_MAX (터치 활성 여부)
let touchBoost = 0; // 실제 적용되는 현재 상승량 (target으로 점진 이동)
let lastTouchMs = 0; // 마지막 touch 수신 시각
let touchStep = 1; // touch 번호별 약간의 차이 (목표 배율)

// Arduino에서 touch:n 들어올 때 호출
export function onTouch(n: number) {
  lastTouchMs = (typeof performance !== "undefined" ? performance : Date).now();
  touchStep = 0.85 + n * 0.05; // 1~4번 약간씩 다른 목표 음정
  touchTarget = BOOST_MAX;
}

// 첫 유저 제스처(클릭/키) 후 1회 호출 — 오디오 시작
export function initBoidSound() {
  if (ctx) {
    ctx.resume?.();
    return;
  }
  ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  master.gain.setTargetAtTime(0.7, ctx.currentTime, 0.6); // 페이드 인

  for (let i = 0; i < MAX_VOICES; i++) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = F_MIN;
    const g = ctx.createGain();
    g.gain.value = 0;
    osc.connect(g);
    g.connect(master);
    osc.start();
    voices.push({ osc, gain: g });
  }
}

// 매 프레임: base boid 위치로 각 보이스 음정/음량 갱신
export function updateBoidSound() {
  if (!ctx) return;
  const cx = CANVAS / 2;
  const cy = CANVAS / 2;
  const maxR = CANVAS / 2;
  const t = ctx.currentTime;

  // 터치 상태 갱신: 일정 시간 신호 없으면 해제 → boost가 0으로 하강
  const nowMs = (typeof performance !== "undefined" ? performance : Date).now();
  if (nowMs - lastTouchMs > TOUCH_TIMEOUT) touchTarget = 0;
  // 순차적으로 상승/하강 (터치 중엔 올라가고, 떼면 내려옴)
  const rate = touchTarget > touchBoost ? BOOST_RISE : BOOST_FALL;
  touchBoost += (touchTarget * touchStep - touchBoost) * rate;
  const pitchMul = 1 + touchBoost; // 드론 음정에 곱해지는 상승 배율

  const bases = boids.filter((b) => !b.colored).slice(0, MAX_VOICES);

  for (let i = 0; i < voices.length; i++) {
    const v = voices[i];
    const b = bases[i];
    if (!b) {
      v.gain.gain.setTargetAtTime(0, t, 0.1);
      continue;
    }
    const d = Math.hypot(b.pos[0] - cx, b.pos[1] - cy);
    const n = Math.min(d / maxR, 1); // 0=중심, 1=외곽
    const freq = (F_MIN + n * (F_MAX - F_MIN)) * pitchMul; // 터치 중 피치 상승
    // 터치 중엔 음량도 올림 (중심 base boid는 평소 거의 무음이라 안 들림)
    const vol = V_MIN + n * (V_MAX - V_MIN) + touchBoost * 0.12;
    v.osc.frequency.setTargetAtTime(freq, t, SMOOTH);
    v.gain.gain.setTargetAtTime(vol, t, SMOOTH);
  }
}
