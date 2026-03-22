"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function CustomContent() {
  const searchParams = useSearchParams();
  const poster = searchParams.get("poster");

  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [name, setName] = useState(""); // 🔥 RIPRISTINATO
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [hdUrl, setHdUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // preview volto
  useEffect(() => {
    if (!faceFile) return;

    const url = URL.createObjectURL(faceFile);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [faceFile]);

  // cleanup preview generata
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result);
    };
  }, [result]);

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

    if (!data.secure_url) {
      throw new Error("Upload fallito Cloudinary");
    }

    return data.secure_url;
  };

  // 🔥 GENERATE
  const handleGenerate = async () => {
    if (!faceFile || !poster || !name) {
      alert("Inserisci immagine e nome");
      return;
    }

    setLoading(true);
    setResult(null);
    setHdUrl(null);

    try {
      const faceUrl = await uploadToCloudinary(faceFile);
      const fullPosterUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${poster}`;

      const res = await fetch("/api/generate/roop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceImageUrl: faceUrl,
          targetImageUrl: fullPosterUrl,
          name: name, // 🔥 PASSATO AL BACKEND
        }),
      });

      if (!res.ok) {
        throw new Error("Errore generazione");
      }

      // preview (watermark)
      const blob = await res.blob();
      const previewUrl = URL.createObjectURL(blob);
      setResult(previewUrl);

      // HD URL
      const hd = res.headers.get("x-hd-url");

      if (!hd) {
        console.error("HD URL missing");
      }

      setHdUrl(hd);

    } catch (err) {
      console.error(err);
      alert("Errore generazione");
    }

    setLoading(false);
  };

  // 🔥 STRIPE
  const handleUnlock = async () => {
    if (!hdUrl) {
      alert("Immagine HD non disponibile");
      return;
    }

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
        console.error(data);
        alert("Errore pagamento");
      }

    } catch (err) {
      console.error(err);
      alert("Errore pagamento");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Create your poster</h1>

        {poster && (
          <img
            src={`${process.env.NEXT_PUBLIC_BASE_URL}${poster}`}
            style={styles.poster}
          />
        )}

        {/* FILE */}
        <input
          type="file"
          onChange={(e) => setFaceFile(e.target.files?.[0] || null)}
        />

        {/* 🔥 INPUT NOME */}
        <input
          type="text"
          placeholder="Nome e cognome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />

        {preview && <img src={preview} style={styles.preview} />}

        <button
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
          }}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate"}
        </button>

        {result && (
          <div style={styles.result}>
            <img src={result} style={styles.image} />

            <div style={styles.overlay}>
              <button
                style={{
                  ...styles.unlockButton,
                  opacity: hdUrl ? 1 : 0.5,
                }}
                onClick={handleUnlock}
                disabled={!hdUrl}
              >
                Unlock HD — €2.99
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0b0f",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
  },
  container: {
    width: 360,
    textAlign: "center" as const,
  },
  title: {
    marginBottom: 20,
  },
  poster: {
    width: "100%",
    borderRadius: 12,
    marginBottom: 20,
  },
  input: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#1a1a22",
    color: "white",
    width: "100%",
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
    border: "none",
    background: "#6c5cff",
    color: "white",
    width: "100%",
    cursor: "pointer",
  },
  result: {
    marginTop: 30,
    position: "relative" as const,
  },
  image: {
    width: "100%",
    borderRadius: 12,
  },
  overlay: {
    position: "absolute" as const,
    inset: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "rgba(0,0,0,0.4)",
    borderRadius: 12,
  },
  unlockButton: {
    padding: 14,
    borderRadius: 10,
    border: "none",
    background: "#00c853",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
};