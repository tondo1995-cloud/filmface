"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SuccessPage() {
  const params = useSearchParams();
  const imageUrl = params.get("image");

  useEffect(() => {
    if (!imageUrl) return;

    const download = async () => {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "filmface-hd.jpg";
      a.click();
    };

    download();
  }, [imageUrl]);

  return (
    <div style={{ padding: 40 }}>
      <h1>Pagamento completato</h1>
      <p>Il download partirà automaticamente...</p>
    </div>
  );
}