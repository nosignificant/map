import P5SketchLoader from "./components/P5SketchLoader";
import VSensorImageList from "./components/VSensorImageList";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-black font-sans">
      <main className="flex flex-1 w-full flex-row flex-wrap items-start justify-center gap-8 py-16 bg-black">
        <P5SketchLoader sketchName="main" />
        <div style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <P5SketchLoader sketchName="unit" />
            <P5SketchLoader sketchName="sonar" />
          </div>
          <VSensorImageList />
        </div>
      </main>
    </div>
  );
}
