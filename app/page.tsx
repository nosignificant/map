import P5SketchLoader from "./components/P5SketchLoader";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full flex-col items-center justify-center py-16 bg-white dark:bg-black">
        <P5SketchLoader />
      </main>
    </div>
  );
}
