"use client";
import { useEffect, useRef } from "react";

const SIZE = 1200;
const BLUE = [150, 195, 235]; // 오래된 trail 색

// 저장된 print(검정)들을 파랑으로 칠해 깔고, 그 위에 현재 print(검정)를 얹어 합성
export default function PrintComposite({ display = 600, refreshMs = 4000 }: { display?: number; refreshMs?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tinted = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const urls = useRef<string[]>([]);

  useEffect(() => {
    let alive = true;

    async function loadList() {
      try {
        const res = await fetch("/api/print-image");
        const list: string[] = await res.json();
        urls.current = list;

        // 새 이미지 → 파랑으로 칠해 캐시
        for (const u of list) {
          if (tinted.current.has(u)) continue;
          const img = new Image();
          img.onload = () => {
            const c = document.createElement("canvas");
            c.width = SIZE;
            c.height = SIZE;
            const ctx = c.getContext("2d")!;
            ctx.drawImage(img, 0, 0, SIZE, SIZE);
            const d = ctx.getImageData(0, 0, SIZE, SIZE);
            const px = d.data;
            for (let i = 0; i < px.length; i += 4) {
              if (px[i + 3] > 10) {
                px[i] = BLUE[0];
                px[i + 1] = BLUE[1];
                px[i + 2] = BLUE[2];
              }
            }
            ctx.putImageData(d, 0, 0);
            tinted.current.set(u, c);
          };
          img.src = u;
        }
        // 삭제된 것 정리
        for (const k of [...tinted.current.keys()]) if (!list.includes(k)) tinted.current.delete(k);
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
        // 1) 오래된 trail (파랑)
        for (const u of urls.current) {
          const t = tinted.current.get(u);
          if (t) ctx.drawImage(t, 0, 0);
        }
        // 2) 현재 trail (검정) — 숨겨진 print 캔버스
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
