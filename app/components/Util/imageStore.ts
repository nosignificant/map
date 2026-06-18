import type p5 from "p5";
import { MakeImgSet } from "./edgeAndCorner";
import { ImgSet } from "../Util/types";

export const vSensorImageUrls: string[] = [];
export const vSensor2ImageUrls: string[] = [];
export const sSensorImageUrls: string[] = [];
export const vSensorUnits: p5.Image[] = [];
export const vSensorUnits2: p5.Image[] = []; // units-3pt-yl (stage+2용)
export const sSensorUnits = new Map<string, p5.Image>();

export const sSensorImgSets = new Map<string, ImgSet>();

let urlsReady: Promise<void> | null = null;
if (typeof window !== "undefined") {
  urlsReady = Promise.all([
    fetch("/api/img?type=vSensor")
      .then((r) => r.json())
      .then((urls: string[]) => vSensorImageUrls.push(...urls)),
    fetch("/api/img?type=vSensor2")
      .then((r) => r.json())
      .then((urls: string[]) => vSensor2ImageUrls.push(...urls)),
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

  for (const url of vSensorImageUrls) {
    p.loadImage(url, (img) => {
      vSensorUnits.push(img);
    });
  }
  for (const url of vSensor2ImageUrls) {
    p.loadImage(url, (img) => {
      vSensorUnits2.push(img);
    });
  }
  for (const url of sSensorImageUrls) {
    p.loadImage(url, (img) => {
      sSensorImgSets.set(url, MakeImgSet(p, img));
    });
  }
}
