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
      }}
    >
      <div className="invert-wrap">
        <div className="overlay-stage">
          {/* 아래 레이어: sonar */}
          <div>
            <P5SketchLoader sketchName="sonar" />
          </div>
          {/* 위 레이어: unit (screen 블렌딩으로 겹침) */}
          <div className="layer-top">
            <P5SketchLoader sketchName="unit" />
          </div>
        </div>
      </div>
    </div>
  );
}
