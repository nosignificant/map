import P5SketchLoader from "../components/P5SketchLoader";

export default function PrintPage() {
  return (
    <div
      className="print-page"
      style={{
        width: "70mm",
        height: "70mm",
        margin: "0 auto",
        padding: "2mm",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
      }}
    >
      {/* 색상 반전 — 흰 종이 위에 검은 선 */}
      <div className="invert-wrap" style={{ filter: "invert(1)" }}>
        {/* 3개 스케치 겹친 무대 (1200×1200 → 66mm로 축소) */}
        <div
          style={{
            position: "relative",
            width: 1200,
            height: 1200,
            transform: "scale(0.215)",
            transformOrigin: "top left",
          }}
        >
          <div style={layerStyle(1)}>
            <P5SketchLoader sketchName="main" />
          </div>
          <div style={layerStyle(2)}>
            <P5SketchLoader sketchName="unit" />
          </div>
          <div style={layerStyle(3)}>
            <P5SketchLoader sketchName="sonar" />
          </div>
        </div>
      </div>
    </div>
  );
}

function layerStyle(z: number): React.CSSProperties {
  return {
    position: "absolute",
    top: 0,
    left: 0,
    width: 1200,
    height: 1200,
    zIndex: z,
    pointerEvents: "none",
  };
}
