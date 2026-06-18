import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";

const DIR = path.join(process.cwd(), "public", "prints");
const PRINT_FILE = path.join(DIR, "print-current.png");
const COPIES = 2; // 출력 매수 (연속)

// base64 PNG → public/prints 저장 → lp로 프린터 출력 (70x70mm)
export async function POST(req: NextRequest) {
  try {
    const { dataUrl } = await req.json();
    const base64 = String(dataUrl).replace(/^data:image\/png;base64,/, "");
    await fs.mkdir(DIR, { recursive: true });
    await fs.writeFile(PRINT_FILE, Buffer.from(base64, "base64"));

    // 매수만큼 lp를 따로 호출 (프린터가 -n을 무시해도 확실히 분리 출력)
    const runLp = () =>
      new Promise<string>((resolve, reject) => {
        execFile("lp", ["-o", "media=Custom.70x70mm", "-o", "fit-to-page", PRINT_FILE], (err, stdout, stderr) => {
          if (err) reject(stderr || err.message);
          else resolve(stdout);
        });
      });

    const outs: string[] = [];
    for (let i = 0; i < COPIES; i++) {
      outs.push(await runLp());
    }

    return NextResponse.json({ ok: true, file: PRINT_FILE, copies: COPIES, jobs: outs });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
