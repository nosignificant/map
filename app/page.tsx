import P5SketchLoader from "./components/P5SketchLoader";
import PrintDownloader from "./components/PrintDownloader";
import "./globals.css";

export default function Home() {
  return (
    <div className="flex flex-row flex-1 items-center justify-center font-sans py-16 gap-8">
      {/* 메인 무대 — 1200×1200에 모든 레이어 겹침 (조작용) */}
      <div className="borderWhite" style={mainStageStyle(1200)}>
        <div style={overlayLayerStyle(1, 1200, true)}>
          <P5SketchLoader sketchName="main" />
        </div>
        <div style={overlayLayerStyle(2, 1200)}>
          <P5SketchLoader sketchName="unit" />
        </div>
        <div style={overlayLayerStyle(3, 1200)}>
          <P5SketchLoader sketchName="sonar" />
        </div>
        <div style={overlayLayerStyle(4, 1200)}>
          <P5SketchLoader sketchName="history" />
        </div>
      </div>

      {/* 출력용 무대 — 색반전, Enter 누르면 이거 다운로드 */}
      <PrintDownloader targetSelector=".print-source" />
      <div
        className="borderWhite print-source"
        style={{
          ...mainStageStyle(400),
          background: "white",
          filter: "invert(1)",
          overflow: "hidden",
        }}
      >
        <div style={{ ...miniScale(0.333), position: "absolute", top: 0, left: 0 }}>
          <div style={{ ...overlayLayerStyle(1, 1200), pointerEvents: "none" }}>
            <P5SketchLoader sketchName="main" />
          </div>
          <div style={overlayLayerStyle(2, 1200)}>
            <P5SketchLoader sketchName="unit" />
          </div>
          <div style={overlayLayerStyle(3, 1200)}>
            <P5SketchLoader sketchName="sonar" />
          </div>
        </div>
      </div>
      <div className="flex flex-row gap-2">
        <div style={overlayLayerStyle(4, 1200)}>
          <P5SketchLoader sketchName="history" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="borderWhite" style={miniStyle(600)}>
            <div style={miniScale(0.333)}>
              <P5SketchLoader sketchName="unit" />
            </div>
          </div>
          <div className="borderWhite" style={miniStyle(600)}>
            <div style={miniScale(0.333)}>
              <P5SketchLoader sketchName="sonar" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 메인 무대 — absolute 자식 담는 컨테이너
function mainStageStyle(size: number): React.CSSProperties {
  return {
    position: "relative",
    width: size,
    height: size,
  };
}

// 메인 무대용 — 같은 자리에 겹침 (absolute)
function overlayLayerStyle(z: number, size: number, clickable: boolean = false): React.CSSProperties {
  return {
    position: "absolute",
    top: 0,
    left: 0,
    width: size,
    height: size,
    zIndex: z,
    pointerEvents: clickable ? "auto" : "none",
  };
}

// 보조 무대 — 1200 원본을 size 박스 안으로 잘라넣음
function miniStyle(size: number): React.CSSProperties {
  return {
    width: size,
    height: size,
    overflow: "hidden",
  };
}

// 1200 캔버스 → 작게 보이도록 scale
function miniScale(scale: number): React.CSSProperties {
  return {
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    width: 1200,
    height: 1200,
  };
}
