"use client";
import { useEffect } from "react";

export default function PrintDownloader() {
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === "Enter") {
        console.log("[print] Enter 감지");
        doPrint();
      }
    }
    function trigger() {
      doPrint(); // 아두이노 버튼(button:click)
    }
    window.addEventListener("keydown", key);
    window.addEventListener("print-trigger", trigger);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("print-trigger", trigger);
    };
  }, []);

  return null;
}

let printing = false;

function doPrint() {
  if (printing) {
    console.log("[print] 쿨다운 중");
    return;
  }
  const canvas = document.querySelector(".print-source canvas") as HTMLCanvasElement | null;
  if (!canvas) {
    console.warn("[print] .print-source canvas 못 찾음");
    return;
  }
  printing = true;
  fetch("/api/print", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl: canvas.toDataURL("image/png") }),
  })
    .then((r) => r.json())
    .then((j) => console.log("[print] 응답:", j)) // ok:true 면 lp 성공, error 있으면 출력
    .catch((e) => console.warn("[print] 요청 실패", e))
    .finally(() => {
      setTimeout(() => (printing = false), 3000);
    });
}
