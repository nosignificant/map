"use client";
import { useEffect, useState } from "react";

// 저장된 print 이미지들을 다 겹쳐 보여줌 (여태까지 그린 trail 누적)
export default function PrintGallery({ refreshMs = 5000 }: { refreshMs?: number }) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/print-image");
        const list = await res.json();
        if (alive) setUrls(list);
      } catch {
        /* 무시 */
      }
    };
    load();
    const id = setInterval(load, refreshMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [refreshMs]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {urls.map((u) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={u} src={u} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
      ))}
    </div>
  );
}
