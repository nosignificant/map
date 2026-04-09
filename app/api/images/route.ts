// public/img 폴더의 이미지 파일 목록을 반환하는 API
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const imgDir = path.join(process.cwd(), "public", "img");

  const files = fs.readdirSync(imgDir).filter((f) =>
    /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f)
  );

  // 브라우저에서 접근 가능한 경로로 변환
  const urls = files.map((f) => `/img/${f}`);

  return NextResponse.json(urls);
}
