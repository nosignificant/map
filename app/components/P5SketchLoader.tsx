"use client";

import dynamic from "next/dynamic";

const P5Sketch = dynamic(() => import("./P5Sketch"), { ssr: false });

export default function P5SketchLoader() {
  return <P5Sketch />;
}
