import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// public/prints 에 저장 → /prints/N.png 로 접근 가능
const DIR = path.join(process.cwd(), "public", "prints");
const SLOTS = 15; // 1.png ~ 15.png 순환

async function slotPath(n: number) {
  return path.join(DIR, `${n}.png`);
}

// 다음 저장 슬롯: 빈 칸 먼저, 다 차면 가장 오래된 것 덮어쓰기 (→ 1~15 순환)
async function nextSlot(): Promise<number> {
  for (let n = 1; n <= SLOTS; n++) {
    try {
      await fs.access(await slotPath(n));
    } catch {
      return n; // 빈 칸
    }
  }
  // 다 찼으면 mtime 가장 오래된 슬롯
  let oldest = 1;
  let oldestM = Infinity;
  for (let n = 1; n <= SLOTS; n++) {
    const m = (await fs.stat(await slotPath(n))).mtimeMs;
    if (m < oldestM) {
      oldestM = m;
      oldest = n;
    }
  }
  return oldest;
}

// GET — 저장된 이미지 URL 목록 (오래된→최신 순, 캐시버스트 포함)
export async function GET() {
  try {
    const files = (await fs.readdir(DIR)).filter((f) => /^\d+\.png$/.test(f));
    const withTime = await Promise.all(files.map(async (f) => ({ f, m: (await fs.stat(path.join(DIR, f))).mtimeMs })));
    withTime.sort((a, b) => a.m - b.m); // 오래된 것 먼저 (그릴 때 뒤에 깔림)
    return NextResponse.json(withTime.map((x) => `/prints/${x.f}?t=${Math.floor(x.m)}`));
  } catch {
    return NextResponse.json([]);
  }
}

// POST — base64 PNG(dataUrl)를 1~15 슬롯에 순환 저장
export async function POST(req: NextRequest) {
  try {
    const { dataUrl } = await req.json();
    const base64 = String(dataUrl).replace(/^data:image\/png;base64,/, "");
    await fs.mkdir(DIR, { recursive: true });

    const slot = await nextSlot();
    await fs.writeFile(await slotPath(slot), Buffer.from(base64, "base64"));

    return NextResponse.json({ ok: true, url: `/prints/${slot}.png` });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
