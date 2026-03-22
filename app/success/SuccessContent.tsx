"use client";

import { useEffect, useState } from "react";

export default function SuccessContent() {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/generate/hd")
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        setImage(url);

        // download automatico
        const a = document.createElement("a");
        a.href = url;
        a.download = "filmface-hd.jpg";
        a.click();
      });
  }, []);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Pagamento completato</h1>

      {image && (
        <>
          <img src={image} style={{ width: 300 }} />
          <br />
          <a href={image} download="filmface-hd.jpg">
            <button>Scarica di nuovo</button>
          </a>
        </>
      )}
    </div>
  );
}