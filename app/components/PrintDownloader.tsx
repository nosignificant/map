"use client";
import { useEffect } from "react";

export default function PrintDownloader() {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Enter") doPrint();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return null;
}

function doPrint() {
  // 현재(검정) trail — 저장용 (다음엔 파랑 old가 됨)
  const live = document.querySelector(".print-source canvas") as HTMLCanvasElement | null;
  // 합성본(파랑 old + 검정 현재) — 다운로드용
  const composite = document.querySelector(".print-composite") as HTMLCanvasElement | null;

  if (live) {
    fetch("/api/print-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl: live.toDataURL("image/png") }),
    }).catch((e) => console.warn("[print 저장 실패]", e));
  }

  // 다운로드는 합성본 (없으면 현재본)
  const out = composite ?? live;
  if (out) {
    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = `print-${Date.now()}.png`;
    a.click();
  }
}
