"use client";

import { useState } from "react";

async function drawPosterName(imageUrl: string, name: string) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl;

  await new Promise((res) => (img.onload = res));

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  // 🔥 FONT
  let fontSize = Math.floor(canvas.width * 0.055);
  ctx.font = `bold ${fontSize}px Arial Black`;
  ctx.fillStyle = "#F5C542";
  ctx.textAlign = "center";

  const maxWidth = canvas.width * 0.8;

  // 🔥 FIT AUTOMATICO
  while (ctx.measureText(name).width > maxWidth) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px Arial Black`;
  }

  // 🔥 POSIZIONE (aggiusta se vuoi)
  const y = canvas.height * 0.08;

  ctx.fillText(name.toUpperCase(), canvas.width / 2, y);

  return canvas.toDataURL("image/jpeg", 1);
}

export default function Page() {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [name, setName] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!source || !target) {
      alert("Inserisci entrambe le immagini");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/generate/roop", {
        method: "POST",
        body: JSON.stringify({
          sourceImageUrl: source,
          targetImageUrl: target,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      // 🔥 AGGIUNGI TESTO QUI (NON IN FLUX)
      const finalImage = await drawPosterName(data.image, name || "");

      setResult(finalImage);
    } catch (err: any) {
      alert(err.message);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>FilmFace</h1>

      <input
        placeholder="URL foto volto"
        value={source}
        onChange={(e) => setSource(e.target.value)}
        style={{ display: "block", marginBottom: 10, width: 400 }}
      />

      <input
        placeholder="URL poster"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        style={{ display: "block", marginBottom: 10, width: 400 }}
      />

      <input
        placeholder="Nome da inserire"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ display: "block", marginBottom: 20, width: 400 }}
      />

      <button onClick={generate} disabled={loading}>
        {loading ? "Generazione..." : "Generate"}
      </button>

      {result && (
        <div style={{ marginTop: 30 }}>
          <img
            src={result}
            alt="result"
            style={{ width: 400, borderRadius: 10 }}
          />
        </div>
      )}
    </div>
  );
}