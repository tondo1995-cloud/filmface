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
  const [name, setName] = useState("");

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
    if (!faceFile || !poster || !name) {
      alert("Inserisci nome e immagine");
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
          name: name,
        }),
      });

      const data = await res.json();

      let imageUrl: string | null = null;

      if (typeof data.image === "string") {
        imageUrl = data.image;
      }

      if (imageUrl) {
        setResult(imageUrl);
      } else {
        console.error("❌ API:", data);
        alert("Errore generazione");
      }

    } catch (err) {
      console.error(err);
      alert("Errore generazione");
    }

    setLoading(false);
  };

  const handleCheckout = async () => {
    if (!result) return;

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl: result }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Errore pagamento");
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Customize</h1>

      {poster && (
        <img
          src={`${process.env.NEXT_PUBLIC_BASE_URL}${poster}`}
          style={styles.poster}
        />
      )}

      {/* 📸 UPLOAD */}
      <input
        type="file"
        onChange={(e) => setFaceFile(e.target.files?.[0] || null)}
      />

      {preview && <img src={preview} style={styles.preview} />}

      {/* ✍️ INPUT NOME */}
      <input
        type="text"
        placeholder="Nome e cognome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={styles.input}
      />

      {/* 🚀 GENERATE */}
      <button style={styles.button} onClick={handleGenerate}>
        {loading ? "Generating..." : "Generate"}
      </button>

      {/* 🎬 RISULTATO */}
      {result && (
        <div style={styles.result}>
          <div style={styles.previewWrapper}>
            <img src={`${result}?q=30`} style={styles.image} />
            <div style={styles.watermark}>PREVIEW</div>
          </div>

          <button style={styles.payButton} onClick={handleCheckout}>
            Download HD – €2.99
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: 40,
    textAlign: "center" as const,
    background: "#0f0f0f",
    minHeight: "100vh",
    color: "white",
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
  },
  poster: {
    width: 200,
    marginBottom: 20,
    borderRadius: 10,
  },
  preview: {
    width: 150,
    marginTop: 10,
    borderRadius: 8,
  },
  input: {
    marginTop: 15,
    padding: 10,
    borderRadius: 8,
    border: "none",
    width: 220,
  },
  button: {
    marginTop: 20,
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#6c5cff",
    color: "white",
    cursor: "pointer",
    width: 200,
  },
  result: {
    marginTop: 30,
  },
  previewWrapper: {
    position: "relative" as const,
    display: "inline-block",
  },
  image: {
    width: 300,
    borderRadius: 10,
    opacity: 0.6,
  },
  watermark: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    opacity: 0.9,
    pointerEvents: "none" as const,
  },
  payButton: {
    marginTop: 15,
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#00c853",
    color: "white",
    cursor: "pointer",
    width: 220,
    fontSize: 16,
  },
};