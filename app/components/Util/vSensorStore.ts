import { VSensor, CheckerGrid } from "./types";
import { initVSensor } from "../sensors/vSensor";

// 메인 / unit 스케치가 같은 vSensor 배열을 공유
let vSensorData: VSensor[] | null = null;

export function initVSensorStore(fg: CheckerGrid[]): VSensor[] {
  if (!vSensorData) {
    vSensorData = initVSensor(fg);
  }
  return vSensorData;
}

export function getVSensor(): VSensor[] | null {
  return vSensorData;
}
