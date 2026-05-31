import type p5 from "p5";
import { MakeImgSet } from "./edgeAndCorner";
import { ImgSet } from "../Util/types";

export const vSensorImageUrls: string[] = [];
export const sSensorImageUrls: string[] = [];
export const vSensorUnits: p5.Image[] = [];
export const sSensorUnits = new Map<string, p5.Image>();

export const sSensorImgSets = new Map<string, ImgSet>();

let urlsReady: Promise<void> | null = null;
if (typeof window !== "undefined") {
  urlsReady = Promise.all([
    fetch("/api/img?type=vSensor")
      .then((r) => r.json())
      .then((urls: string[]) => vSensorImageUrls.push(...urls)),
    fetch("/api/img?type=sSensor")
      .then((r) => r.json())
      .then((urls: string[]) => sSensorImageUrls.push(...urls)),
  ]).then(() => undefined);
}

let attached = false;
export async function initImages(p: p5) {
  if (attached) return;
  attached = true;

  await urlsReady;

  vSensorImageUrls.forEach((url) => p.loadImage(url, (img) => vSensorUnits.push(img)));
  sSensorImageUrls.forEach((url) =>
    p.loadImage(url, (img) => {
      sSensorUnits.set(url, img);
      sSensorImgSets.set(url, MakeImgSet(p, img)); // ← 로드 시 edge도 계산
    })
  );
}
