import { MorphFn, Sign } from "./types";

export function setupSign(m: MorphFn, mc: number): Sign {
  return { morphFn: m, grow: 0, cooldown: 0, maxCool: mc, shrink: 0, repeat: 0 };
}

export async function loadPath(url: string): Promise<string> {
  const res = await fetch(url);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  return doc.querySelector("path")?.getAttribute("d") ?? "";
}
