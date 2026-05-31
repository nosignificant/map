"use client";
import { useEffect } from "react";

export default function PrintDownloader({ targetSelector = ".print-source" }: { targetSelector?: string }) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      downloadPrintImage(targetSelector);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [targetSelector]);

  return null;
}

function downloadPrintImage(selector: string) {
  const stage = document.querySelector(selector);
  if (!stage) {
    console.warn("[PrintDownloader] selector not found:", selector);
    return;
  }

  const canvases = stage.querySelectorAll("canvas");
  if (!canvases.length) {
    console.warn("[PrintDownloader] no canvases found");
    return;
  }

  const W = 1200;
  const H = 1200;
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const ctx = out.getContext("2d");
  if (!ctx) return;

  // 검정 배경 먼저 — invert 후 흰 종이가 됨
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, W, H);

  // 각 캔버스를 위에 겹쳐 그림 (DOM 순서 = z-index 낮은 것부터)
  canvases.forEach((c) => {
    ctx.drawImage(c as HTMLCanvasElement, 0, 0, W, H);
  });

  // 색상 반전 — 검정 배경 → 흰 종이, 흰 선 → 검정
  const imgData = ctx.getImageData(0, 0, W, H);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 255 - d[i];
    d[i + 1] = 255 - d[i + 1];
    d[i + 2] = 255 - d[i + 2];
    d[i + 3] = 255; // alpha 완전 불투명 (PNG 깔끔하게)
  }
  ctx.putImageData(imgData, 0, 0);

  // 다운로드
  out.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `print-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
    console.log("[PrintDownloader] 다운로드 완료");
  }, "image/png");
}
