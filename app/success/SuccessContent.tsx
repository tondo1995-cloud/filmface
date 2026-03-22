"use client";

import { useSearchParams } from "next/navigation";

export default function SuccessContent() {
  const params = useSearchParams();
  const image = params.get("image");

  if (!image) {
    return <div>Nessuna immagine trovata</div>;
  }

  const handleDownload = async () => {
    const res = await fetch(image);
    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "filmface-hd.jpg";
    a.click();
  };

  return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <h1>Pagamento completato</h1>

      <img
        src={image}
        style={{ width: 300, borderRadius: 12, marginTop: 20 }}
      />

      <button
        onClick={handleDownload}
        style={{
          marginTop: 20,
          padding: 14,
          borderRadius: 10,
          background: "#6c5cff",
          color: "white",
          border: "none",
        }}
      >
        Download HD
      </button>
    </div>
  );
}