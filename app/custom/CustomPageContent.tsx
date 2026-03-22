"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function CustomContent() {
  const searchParams = useSearchParams();
  const poster = searchParams.get("poster");

  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (faceFile) {
      const url = URL.createObjectURL(faceFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
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

    if (!data.secure_url) {
      throw new Error("Upload fallito Cloudinary");
    }

    return data.secure_url;
  };

  // 🔥 GENERATE
  const handleGenerate = async () => {
    if (!faceFile || !poster) {
      alert("Inserisci immagine");
      return;
    }

    setLoading(true);
    setResult(null);

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
        }),
      });

      // 🔥 IMPORTANTE: blob (non JSON)
      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);

      setResult(imageUrl);
    } catch (err) {
      console.error(err);
      alert("Errore generazione");
    }

    setLoading(false);
  };

  // 🔥 STRIPE CHECKOUT
  const handleUnlock = async () => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
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

        {/* POSTER */}
        {poster && (
          <div style={styles.posterWrapper}>
            <img
              src={`${process.env.NEXT_PUBLIC_BASE_URL}${poster}`}
              style={styles.poster}
            />
          </div>
        )}

        {/* INPUT */}
        <input
          type="file"
          onChange={(e) => setFaceFile(e.target.files?.[0] || null)}
          style={styles.file}
        />

        {/* PREVIEW */}
        {preview && <img src={preview} style={styles.preview} />}

        {/* GENERATE */}
        <button style={styles.button} onClick={handleGenerate}>
          {loading ? "Generating..." : "Generate"}
        </button>

        {/* RESULT */}
        {result && (
          <div style={styles.result}>
            <img src={result} style={styles.image} />

            {/* OVERLAY + PAY */}
            <div style={styles.overlay}>
              <div style={styles.overlayContent}>
                <div style={styles.overlayText}>
                  Watermarked Preview
                </div>

                <button style={styles.unlockButton} onClick={handleUnlock}>
                  Unlock HD — €4.99
                </button>
              </div>
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
    fontFamily: "sans-serif",
  },
  container: {
    width: 360,
    textAlign: "center" as const,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
  },
  posterWrapper: {
    marginBottom: 20,
  },
  poster: {
    width: "100%",
    borderRadius: 12,
  },
  file: {
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
    background: "#6c5cff",
    color: "white",
    cursor: "pointer",
    width: "100%",
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
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  overlayContent: {
    textAlign: "center" as const,
  },
  overlayText: {
    marginBottom: 10,
  },
  unlockButton: {
    padding: "12px 18px",
    borderRadius: 10,
    border: "none",
    background: "#00c853",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
};