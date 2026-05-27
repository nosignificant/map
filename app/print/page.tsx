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
        <P5SketchLoader sketchName="print" />
      </div>
    </div>
  );
}
