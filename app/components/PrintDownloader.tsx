"use client";
import { useEffect } from "react";

export default function PrintDownloader({ targetSelector = ".print-source" }: { targetSelector?: string }) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Enter") downloadPrintImage(targetSelector);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [targetSelector]);

  return null;
}

function downloadPrintImage(selector: string) {
  const stage = document.querySelector(selector);
  const canvas = stage?.querySelector("canvas") as HTMLCanvasElement | null;
  if (!canvas) {
    console.warn("[PrintDownloader] canvas not found:", selector);
    return;
  }

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `print-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
