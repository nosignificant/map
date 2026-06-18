import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getImagesRecursive(dir: string, base: string): string[] {
  const urls: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const urlPath = `${base}/${entry.name}`;
    if (entry.isDirectory()) {
      urls.push(...getImagesRecursive(fullPath, urlPath));
    } else if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(entry.name)) {
      urls.push(urlPath);
    }
  }
  return urls;
}

const DIRS: Record<string, string> = {
  vSensor: "units-1pt-bk",
  vSensor2: "units-3pt-yl",
  sSensor: "sSensor",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "vSensor";
  const folder = DIRS[type] ?? DIRS.vSensor;

  const imgDir = path.join(process.cwd(), "public", "units", folder);
  const isRecursive = type === "sSensor";

  let urls: string[];
  if (isRecursive) {
    urls = getImagesRecursive(imgDir, `/units/${folder}`);
  } else {
    urls = fs
      .readdirSync(imgDir)
      .filter((f) => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f))
      .map((f) => `/units/${folder}/${f}`);
  }

  return NextResponse.json(urls);
}
