"use client";

// React 컴포넌트 — 씬에 오브젝트 올리는 역할만 담당
// 실제 로직은 sketch.ts / edgeDetection.ts / types.ts 에 있음
import { useEffect, useRef } from "react";
import type p5 from "p5";
import { Sketch } from "./Sketch";
import { SketchUnit } from "./SketchUnit";
import { SketchSonar } from "./SketchSonar";

const SKETCHES = {
  main: Sketch,
  unit: SketchUnit,
  sonar: SketchSonar,
};

export default function P5Sketch({ sketchName = "main" }: { sketchName?: keyof typeof SKETCHES }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sketch: p5 | null = null;
    let cancelled = false;

    import("p5").then((mod) => {
      if (cancelled) return;
      sketch = SKETCHES[sketchName](containerRef.current!);
    });

    return () => {
      cancelled = true;
      sketch?.remove();
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <div ref={containerRef} />
    </div>
  );
}
