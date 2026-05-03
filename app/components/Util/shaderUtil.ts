import { CANVAS } from "./constant";
export async function shaderCobine(): Promise<{ vertSrc: string; fragCombined: string }> {
  const vertSrc = await fetch("/shaders/sketch.vert").then((r) => r.text());
  const [fragSrc, sdfSrc, connSrc, sensorSrc, tapestrySrc, trailSrc, ditherSrc] = await Promise.all([
    fetch("/shaders/sketch.frag").then((r) => r.text()),
    fetch("/shaders/sdf.glsl").then((r) => r.text()),
    fetch("/shaders/connections.glsl").then((r) => r.text()),
    fetch("/shaders/sensors.glsl").then((r) => r.text()),
    fetch("/shaders/tapestry.glsl").then((r) => r.text()),
    fetch("/shaders/trail.glsl").then((r) => r.text()),
    fetch("/shaders/dither.glsl").then((r) => r.text()),
  ]);
  const fragCombined = fragSrc
    .replace("// #include sdf.glsl", sdfSrc)
    .replace("// #include connections.glsl", connSrc)
    .replace("// #include sensors.glsl", sensorSrc)
    .replace("// #include tapestry.glsl", tapestrySrc)
    .replace("// #include trail.glsl", trailSrc)
    .replace("// #include dither.glsl", ditherSrc);

  return { vertSrc, fragCombined };
}

export function computePos4Shader(pos: [number, number]): [number, number] {
  return [pos[0] - CANVAS / 2, pos[1] - CANVAS / 2];
}
