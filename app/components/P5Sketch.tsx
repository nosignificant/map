"use client";

// React 컴포넌트 — 씬에 오브젝트 올리는 역할만 담당
// 실제 로직은 sketch.ts / edgeDetection.ts / types.ts 에 있음
import { useEffect, useRef } from "react";
import type p5 from "p5";
import { createSketch } from "./sketch";

//monobehaviour
export default function P5Sketch() {
  
  //GameObject containerRef;
  const containerRef = useRef<HTMLDivElement>(null);

  //void Start
  useEffect(() => {

    let sketch: p5 | null = null;
    let cancelled = false;
    //p5js는 브라우저 전용이라 불러오는데 시간이 걸림
    //p5를 불러오고 그안에서 Mod를 꺼냄
    //instantiate(createSketch(...) - 이 monobehaviour을, containerRef 라는 pos에다가)
    import("p5").then((mod) => {
if (cancelled) return; 
      //클래스를 꺼내야 new GameObject 이렇게 쓸 수 있대
      const P5 = mod.default;
      sketch = new P5(createSketch(containerRef.current!), containerRef.current!);
    });

    return () => { cancelled = true;
      sketch?.remove(); };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      {/* containerRef = GetComponen<div>(); */}
      <div ref={containerRef} />
    </div>
  );
}
