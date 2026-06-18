"use client";
import { useEffect, useRef } from "react";

const SIZE = 1200;

// 저장된 print(old) + 현재 print(live)를 합성해서 보여줌 (틴트 없이 원본 그대로)
export default function PrintComposite({ display = 600, refreshMs = 4000 }: { display?: number; refreshMs?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgs = useRef<Map<string, HTMLImageElement>>(new Map());
  const urls = useRef<string[]>([]);

  useEffect(() => {
    let alive = true;

    async function loadList() {
      try {
        const res = await fetch("/api/print-image");
        const list: string[] = await res.json();
        urls.current = list;
        for (const u of list) {
          if (imgs.current.has(u)) continue;
          const img = new Image();
          img.src = u;
          imgs.current.set(u, img);
        }
        for (const k of [...imgs.current.keys()]) if (!list.includes(k)) imgs.current.delete(k);
      } catch {
        /* 무시 */
      }
    }

    loadList();
    const id = setInterval(loadList, refreshMs);

    let raf = 0;
    const draw = () => {
      if (!alive) return;
      const cv = canvasRef.current;
      if (cv) {
        const ctx = cv.getContext("2d")!;
        ctx.clearRect(0, 0, SIZE, SIZE);
        // 1) 저장된 old 이미지들 (원본)
        for (const u of urls.current) {
          const img = imgs.current.get(u);
          if (img && img.complete) ctx.drawImage(img, 0, 0, SIZE, SIZE);
        }
        // 2) 현재 trail (숨겨진 print 캔버스)
        const live = document.querySelector(".print-source canvas") as HTMLCanvasElement | null;
        if (live) ctx.drawImage(live, 0, 0, SIZE, SIZE);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      alive = false;
      clearInterval(id);
      cancelAnimationFrame(raf);
    };
  }, [refreshMs]);

  return <canvas ref={canvasRef} width={SIZE} height={SIZE} className="print-composite" style={{ width: display, height: display, background: "white" }} />;
}
