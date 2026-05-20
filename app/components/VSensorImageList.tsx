"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getImageList, subscribeImageHistory } from "./Util/imageHistoryStore";

const CELL = 80;

export default function VSensorImageList() {
  const [list, setList] = useState<{ current: string | null; history: string[] }>({
    current: null,
    history: [],
  });

  useEffect(() => {
    setList(getImageList());
    return subscribeImageHistory(() => setList({ ...getImageList() }));
  }, []);

  const rows: (string | null)[] = [list.current, ...list.history];
  while (rows.length < 10) rows.push(null);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        border: "1px solid #333",
      }}
    >
      {rows.slice(0, 10).map((url, i) => (
        <div
          key={i}
          style={{
            width: CELL,
            height: CELL,
            background: "#000",
            border: i === 0 ? "1px solid #fff" : "1px solid #333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {url ? (
            <Image src={url} alt="" fill style={{ objectFit: "contain" }} />
          ) : (
            <span style={{ color: "#333", fontSize: 10 }}>{i === 0 ? "current" : `−${i}`}</span>
          )}
        </div>
      ))}
    </div>
  );
}
