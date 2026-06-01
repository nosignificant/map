import P5SketchLoader from "./components/P5SketchLoader";
import PrintDownloader from "./components/PrintDownloader";
import PrintComposite from "./components/PrintComposite";
import "./globals.css";

export default function Home() {
  return (
    <div className="flex flex-row flex-1 items-center justify-center font-sans py-16 gap-8">
      {/* 메인 무대 — 1200×1200에 모든 레이어 겹침 (조작용) */}
      <div style={mainStageStyle(1200)}>
        <div style={overlayLayerStyle(1, 1200, true)}>
          <P5SketchLoader sketchName="main" />
        </div>
        <div style={overlayLayerStyle(2, 1200)}>
          <P5SketchLoader sketchName="sonar" />
        </div>
        <div style={overlayLayerStyle(3, 1200)}>
          <P5SketchLoader sketchName="unit" />
        </div>
      </div>
      <div style={overlayLayerStyle(4, 1200)}>
        <P5SketchLoader sketchName="history" />
      </div>

      {/* 캡처용 print 캔버스 — 화면 밖에 숨김 (Enter 시 이걸 저장) */}
      <div className="print-source" style={offscreenStyle}>
        <P5SketchLoader sketchName="print" />
      </div>
      <PrintDownloader />

      {/* 합성: 오래된 trail(파랑) + 현재 trail(검정) 겹침 — Enter 시 이게 프린트됨 */}
      <div className="borderWhite" style={printPreviewStyle(600)}>
        <PrintComposite display={600} />
      </div>
    </div>
  );
}

// 캡처용 — 화면 밖에 두되 렌더는 됨
const offscreenStyle: React.CSSProperties = {
  position: "absolute",
  left: -99999,
  top: 0,
  width: 1200,
  height: 1200,
  pointerEvents: "none",
};

// 출력 미리보기 — 흰 배경 + 1200 캔버스를 박스 안으로 잘라넣음
function printPreviewStyle(size: number): React.CSSProperties {
  return {
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
