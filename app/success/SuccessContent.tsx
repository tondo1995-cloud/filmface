"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SuccessContent() {
  const params = useSearchParams();

  const rawImage = params.get("image");
  const image = rawImage ? decodeURIComponent(rawImage) : null;

  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      setLoading(false);
      return;
    }

    let objectUrl: string | null = null;

    const loadImage = async () => {
      try {
        const res = await fetch(image);

        if (!res.ok) {
          throw new Error("Errore download immagine");
        }

        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);

        setImageUrl(objectUrl);

        // 🔥 download automatico
        setTimeout(() => {
          const a = document.createElement("a");
          a.href = objectUrl!;
          a.download = "filmface-hd.jpg";
          document.body.appendChild(a);
          a.click();
          a.remove();
        }, 300);

      } catch (err) {
        console.error("DOWNLOAD ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    // ✅ cleanup corretto (usa objectUrl locale)
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };

  }, [image]);

  if (!image) {
    return (
      <div style={styles.page}>
        <h1>Nessuna immagine trovata</h1>
        <p style={{ opacity: 0.7 }}>
          Torna indietro e genera una nuova immagine
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Pagamento completato</h1>

      {loading && <p>Preparazione download...</p>}

      {imageUrl && (
        <>
          <img src={imageUrl} style={styles.image} />

          <button
            style={styles.button}
            onClick={() => {
              const a = document.createElement("a");
              a.href = imageUrl;
              a.download = "filmface-hd.jpg";
              document.body.appendChild(a);
              a.click();
              a.remove();
            }}
          >
            Scarica di nuovo
          </button>
        </>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0b0f",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    textAlign: "center" as const,
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  image: {
    width: 300,
    borderRadius: 12,
    marginTop: 20,
  },
  button: {
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
    border: "none",
    background: "#6c5cff",
    color: "white",
    cursor: "pointer",
  },
};