import type p5 from "p5";

export const vSensorUnits: p5.Image[] = [];
export const sSensorUnits = new Map<string, p5.Image>();

export function initImages(p: p5) {
  vSensorUnits.length = 0;
  sSensorUnits.clear();

  fetch("/api/img?type=vSensor")
    .then((res) => res.json())
    .then((urls: string[]) => {
      urls.forEach((url) => p.loadImage(url, (img) => vSensorUnits.push(img)));
    });

  fetch("/api/img?type=sSensor")
    .then((res) => res.json())
    .then((urls: string[]) => {
      urls.forEach((url) => p.loadImage(url, (img) => sSensorUnits.set(url, img)));
    });
}
