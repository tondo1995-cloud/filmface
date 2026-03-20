"use client";

import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const params = useSearchParams();
  const image = params.get("image");

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Pagamento completato</h1>

      {image && (
        <>
          <img src={image} style={{ width: 300 }} />

          <br /><br />

          <a href={image} download>
            <button>Scarica immagine</button>
          </a>
        </>
      )}
    </div>
  );
}