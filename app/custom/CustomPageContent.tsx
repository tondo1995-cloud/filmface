"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function CustomContent() {
  const searchParams = useSearchParams();
  const rawPoster = searchParams.get("poster");
  const poster = rawPoster ? decodeURIComponent(rawPoster) : null;

  const cloudPoster = poster
    ? `https://res.cloudinary.com/daklqmlsf/image/upload${poster}`
    : null;

  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [hdUrl, setHdUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!faceFile) return;
    const url = URL.createObjectURL(faceFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [faceFile]);

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
    );

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    if (!data.secure_url) throw new Error("Upload fallito");

    return data.secure_url;
  };

  const handleGenerate = async () => {
    if (!faceFile) {
      alert("Carica una foto");
      return;
    }

    if (!cloudPoster) {
      alert("Poster non valido");
      return;
    }

    setLoading(true);
    setResult(null);
    setHdUrl(null);

    try {
      const faceUrl = await uploadToCloudinary(faceFile);

      const res = await fetch("/api/generate/roop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceImageUrl: faceUrl,
          targetImageUrl: cloudPoster,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.preview) {
        throw new Error("Errore generazione");
      }

      setResult(data.preview);
      setHdUrl(data.hd);
    } catch (err) {
      alert("Errore generazione");
    }

    setLoading(false);
  };

  const handleCheckout = async () => {
    if (!hdUrl) return;

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: hdUrl,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Errore pagamento");
      }
    } catch {
      alert("Errore pagamento");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>
          Trasforma il tuo amico in una leggenda
        </h1>

        {cloudPoster && (
          <img src={cloudPoster} style={styles.poster} />
        )}

        <label style={styles.uploadButton}>
          {faceFile ? "Volto caricato ✅" : "Carica una foto"}
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setFaceFile(e.target.files?.[0] || null)
            }
            style={{ display: "none" }}
          />
        </label>

        {preview && (
          <img src={preview} style={styles.preview} />
        )}

        <button
          style={styles.button}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading
            ? "Creazione in corso..."
            : "Genera gratis"}
        </button>

        {result && (
          <div style={styles.result}>
            <img src={result} style={styles.image} />

            <div style={styles.ctaBox}>
              <p style={styles.ctaText}>
                Scarica la versione HD senza watermark
              </p>

              <button
                style={styles.unlockButton}
                onClick={handleCheckout}
                disabled={!hdUrl}
              >
                Sblocca HD — 0,50€
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    background: "#0b0b0f",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontFamily: "var(--font-inter)",
  },

  container: {
    width: 360,
    textAlign: "center",
  },

  title: {
    marginBottom: 20,
    fontWeight: 700,
  },

  poster: {
    width: "100%",
    borderRadius: 12,
    marginBottom: 20,
  },

  uploadButton: {
    display: "block",
    padding: 14,
    borderRadius: 12,
    background: "white",
    color: "black",
    fontWeight: 600,
    cursor: "pointer",
  },

  preview: {
    width: 100,
    marginTop: 10,
    borderRadius: 10,
  },

  button: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    background: "#6c5cff",
    color: "white",
    width: "100%",
    cursor: "pointer",
    fontWeight: 700,
  },

  result: {
    marginTop: 30,
  },

  image: {
    width: "100%",
    borderRadius: 12,
  },

  ctaBox: {
    marginTop: 15,
    padding: 16,
    background: "#111",
    borderRadius: 12,
  },

  ctaText: {
    fontSize: 14,
    marginBottom: 10,
    opacity: 0.8,
  },

  unlockButton: {
    padding: 14,
    borderRadius: 10,
    background: "#00c853",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
  },
};