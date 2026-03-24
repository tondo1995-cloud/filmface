"use client";

import { useState, useEffect } from "react";

export default function CustomContent() {
  const [faceFile, setFaceFile] = useState<File | null>(null);
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

  // cleanup result
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result);
    };
  }, [result]);

  // upload cloudinary
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
      throw new Error("Upload fallito");
    }

    return data.secure_url;
  };

  // GENERATE
  const handleGenerate = async () => {
    if (!faceFile) {
      alert("CARICA UNA FOTO");
      return;
    }

    setLoading(true);
    setResult(null);
    setHdUrl(null);

    try {
      const faceUrl = await uploadToCloudinary(faceFile);

      const fullPosterUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/posters/wolf-fumatore.jpg`;

      const res = await fetch("/api/generate/roop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceImageUrl: faceUrl,
          targetImageUrl: fullPosterUrl,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const blob = await res.blob();
      const previewUrl = URL.createObjectURL(blob);
      setResult(previewUrl);

      const hd = res.headers.get("x-hd-url");

      if (hd && hd.startsWith("http")) {
        setHdUrl(hd);
      } else {
        console.error("HD URL non valida:", hd);
      }

    } catch (err) {
      console.error(err);
      alert("ERRORE GENERAZIONE");
    }

    setLoading(false);
  };

  // CHECKOUT
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
        alert("ERRORE PAGAMENTO");
      }
    } catch (err) {
      console.error(err);
      alert("ERRORE PAGAMENTO");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>
          METTI IL TUO AMICO IN UN FILM
        </h1>

        <img
          src="/posters/wolf-fumatore.jpg"
          style={styles.poster}
        />

        {/* 🔥 UPLOAD BUTTON */}
        <label style={styles.uploadButton}>
          {faceFile
            ? "VOLTO CARICATO ✅"
            : "CARICA IL VOLTO DA INSERIRE"}
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setFaceFile(e.target.files?.[0] || null)
            }
            style={{ display: "none" }}
          />
        </label>

        {/* preview */}
        {preview && (
          <img src={preview} style={styles.preview} />
        )}

        {/* GENERATE */}
        <button
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
          }}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading
            ? "GENERAZIONE..."
            : "CREA ORA IL TUO MEME"}
        </button>

        {/* RESULT */}
        {result && (
          <div style={styles.result}>
            <img src={result} style={styles.image} />

            <div style={styles.overlay}>
              <button
                style={styles.unlockButton}
                onClick={handleCheckout}
                disabled={!hdUrl}
              >
                SCARICA IN HD — 0,30€
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
    fontFamily: "var(--font-inter)",
  },

  container: {
    width: 360,
    textAlign: "center" as const,
  },

  title: {
    marginBottom: 20,
    fontFamily: "var(--font-grotesk)",
    fontWeight: 700,
    letterSpacing: -0.5,
  },

  poster: {
    width: "100%",
    borderRadius: 12,
    marginBottom: 20,
  },

  uploadButton: {
    display: "block",
    width: "100%",
    padding: 14,
    borderRadius: 12,
    background: "white",
    color: "black",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 10,
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
    background: "linear-gradient(135deg, #6c5cff, #8a7dff)",
    color: "white",
    width: "100%",
    cursor: "pointer",
    fontWeight: 600,
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
    background: "#00c853",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
};