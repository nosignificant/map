import P5SketchLoader from "./components/P5SketchLoader";
import PrintDownloader from "./components/PrintDownloader";
import "./globals.css";

export default function Home() {
  return (
    <div className="flex flex-row flex-1 items-center justify-center font-sans py-16 gap-8">
      <div>
        <img src="/logo.png" alt=""></img>
      </div>

      <div style={mainStageStyle(1200)}>
        <div style={overlayLayerStyle(1, 1200)}>
          <P5SketchLoader sketchName="sonar" />
        </div>
        <div style={overlayLayerStyle(2, 1200, true)}>
          <P5SketchLoader sketchName="main" />
        </div>
        <div style={overlayLayerStyle(3, 1200)}>
          <P5SketchLoader sketchName="unit" />
        </div>
      </div>
      <div style={overlayLayerStyle(4, 1200)}>
        <P5SketchLoader sketchName="history" />
      </div>

      {/* print = accumulate에서 최근/빈도순 뽑아 그리는 캔버스 (Enter/버튼 시 출력) */}
      <div className="borderWhite print-source" style={printPreviewStyle(600)}>
        <div style={miniScale(0.5)}>
          <P5SketchLoader sketchName="print" />
        </div>
      </div>
      <PrintDownloader />
    </div>
  );
}

// 출력 미리보기 — 흰 배경 + 1200 캔버스를 박스 안으로 잘라넣음
// 화면 밖으로 치워서 숨김(캔버스는 살아있어야 출력됨)
function printPreviewStyle(size: number): React.CSSProperties {
  return {
    position: "absolute",
    left: -99999, // 화면 왼쪽 밖으로 (캔버스는 계속 렌더 → 출력 정상)
    top: 0,
    width: size,
    height: size,
    overflow: "hidden",
    background: "white",
  };
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
