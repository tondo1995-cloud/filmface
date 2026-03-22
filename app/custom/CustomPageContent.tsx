"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function CustomContent() {
  const searchParams = useSearchParams();
  const poster = searchParams.get("poster");

  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [hdUrl, setHdUrl] = useState<string | null>(null);
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

      const blob = await res.blob();
      const previewUrl = URL.createObjectURL(blob);
      setResult(previewUrl);

      // 🔥 URL HD dal backend
      const hd = res.headers.get("x-hd-url");
      if (hd) setHdUrl(hd);

    } catch (err) {
      console.error(err);
      alert("Errore generazione");
    }

    setLoading(false);
  };

  const handleUnlock = async () => {
    try {
      if (!hdUrl) {
        alert("Immagine HD non disponibile");
        return;
      }

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

        <input
          type="file"
          onChange={(e) => setFaceFile(e.target.files?.[0] || null)}
        />

        {preview && <img src={preview} style={styles.preview} />}

        <button style={styles.button} onClick={handleGenerate}>
          {loading ? "Generating..." : "Generate"}
        </button>

        {result && (
          <div style={styles.result}>
            <img src={result} style={styles.image} />

            <div style={styles.overlay}>
              <button style={styles.unlockButton} onClick={handleUnlock}>
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
  },
  unlockButton: {
    padding: 14,
    borderRadius: 10,
    border: "none",
    background: "#00c853",
    color: "white",
    fontWeight: "bold",
  },
};