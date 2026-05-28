import P5SketchLoader from "./components/P5SketchLoader";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans py-16">
      <div className="stage">
        {/* 가장 아래 — shader 배경 */}
        <div className="layer" style={layerStyle(1)}>
          <P5SketchLoader sketchName="main" />
        </div>

        {/* unit 이미지 */}
        <div className="layer" style={layerStyle(2)}>
          <P5SketchLoader sketchName="unit" />
        </div>

        {/* sonar 이미지 */}
        <div className="layer" style={layerStyle(3)}>
          <P5SketchLoader sketchName="sonar" />
        </div>

        {/* history (선택) — 필요 없으면 제거 */}
        <div className="layer" style={layerStyle(4)}>
          <P5SketchLoader sketchName="history" />
        </div>
      </div>
    </div>
  );
}

// 모든 레이어 공통 — 같은 자리에 absolute, 클릭은 통과
function layerStyle(z: number): React.CSSProperties {
  return {
    position: "absolute",
    top: 0,
    left: 0,
    width: 1200,
    height: 1200,
    zIndex: z,
    pointerEvents: z === 1 ? "auto" : "none", // 가장 아래(main)만 마우스 받음
  };
}
