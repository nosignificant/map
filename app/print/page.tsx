import fs from "fs";
import path from "path";

// 인쇄할 때마다 최신 파일을 읽도록 (캐시 X)
export const dynamic = "force-dynamic";

export default function PrintPage() {
  const dir = path.join(process.cwd(), "public", "prints");

  let files: string[] = [];
  try {
    files = fs
      .readdirSync(dir)
      .filter((f) => /^\d+\.png$/.test(f))
      .map((f) => ({ f, m: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => a.m - b.m) // 오래된 것 먼저 (뒤에 깔림)
      .map((x) => x.f);
  } catch {
    files = [];
  }

  return (
    <>
      {/* 70x70mm 용지 꽉 차게, 여백 0 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page { size: 70mm 70mm; margin: 0; }
            html, body { margin: 0; padding: 0; background: #fff; }
          `,
        }}
      />
      <div style={{ width: "70mm", height: "70mm", position: "relative", background: "#fff" }}>
        {files.map((f) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={f} src={`/prints/${f}`} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
        ))}
      </div>
    </>
  );
}
