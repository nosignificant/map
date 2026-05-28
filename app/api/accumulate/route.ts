import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// 프로젝트 루트에 저장 (npm run dev 실행한 곳 기준)
const FILE_PATH = path.join(process.cwd(), "accumulate.json");

// GET — 디스크에서 누적 데이터 읽어 반환
export async function GET() {
  try {
    const data = await fs.readFile(FILE_PATH, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    // 파일 없으면 빈 상태 반환
    return NextResponse.json({
      vSensorAccumulate: [],
      sSensor1Accumulate: [],
      sSensor2Accumulate: [],
    });
  }
}

// POST — 받은 데이터를 디스크에 저장 (덮어쓰기)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await fs.writeFile(FILE_PATH, JSON.stringify(body, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
