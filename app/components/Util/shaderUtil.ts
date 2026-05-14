import { CANVAS } from "./constant";
export async function shaderCobine(): Promise<{ vertSrc: string; fragCombined: string }> {
  const vertSrc = await fetch("/shaders/sketch.vert").then((r) => r.text());
  const [fragSrc, sdfSrc, tapestrySrc] = await Promise.all([
    fetch("/shaders/sketch.frag").then((r) => r.text()),
    fetch("/shaders/sdf.glsl").then((r) => r.text()),
    fetch("/shaders/tapestry.glsl").then((r) => r.text()),
  ]);
  const fragCombined = fragSrc.replace("// #include sdf.glsl", sdfSrc).replace("// #include tapestry.glsl", tapestrySrc);

  return { vertSrc, fragCombined };
}

export function computePos4Shader(pos: [number, number]): [number, number] {
  return [pos[0] - CANVAS / 2, pos[1] - CANVAS / 2];
}
