"use client";

import dynamic from "next/dynamic";

const P5Sketch = dynamic(() => import("./P5Sketch"), { ssr: false });

export default function P5SketchLoader({ sketchName }: { sketchName?: "main" | "unit" | "sonar" | "history" | "print" }) {
  return <P5Sketch sketchName={sketchName} />;
}
