import P5SketchLoader from "./components/P5SketchLoader";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans">
      <main className="flex flex-1 w-full flex-row flex-wrap items-start justify-center gap-8 py-16">
        <P5SketchLoader sketchName="main" />
        <div>
          <P5SketchLoader sketchName="unit" />
          <P5SketchLoader sketchName="sonar" />
          <P5SketchLoader sketchName="history" />
        </div>
      </main>
      <P5SketchLoader sketchName="print" />
    </div>
  );
}
