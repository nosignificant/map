import P5SketchLoader from "./components/P5SketchLoader";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-black font-sans">
      <main className="flex flex-1 w-full flex-row flex-wrap items-center justify-center gap-8 py-16 bg-black">
        <P5SketchLoader sketchName="main" />
        <P5SketchLoader sketchName="unit" />
        <P5SketchLoader sketchName="sonar" />
      </main>
    </div>
  );
}
