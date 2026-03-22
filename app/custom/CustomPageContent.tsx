"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function CustomContent() {
  const searchParams = useSearchParams();
  const poster = searchParams.get("poster");

  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [name, setName] = useState("");
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

  const handleGenerate = async () => {
    if (!faceFile || !poster || !name) {
      alert("Inserisci immagine e nome");
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

      if (data.image) {
        setResult(data.image);
      } else {
        console.error(data);
        alert("Errore generazione");
      }
    } catch (err) {
      console.error(err);
      alert("Errore generazione");
    }

    setLoading(false);
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

      <input
        type="file"
        onChange={(e) => setFaceFile(e.target.files?.[0] || null)}
      />

      <input
        type="text"
        placeholder="Nome e cognome"
        value={name}
        onChange={(e) => setName(e.target.value.toUpperCase())}
        style={styles.input}
      />

      {preview && <img src={preview} style={styles.preview} />}

      <button style={styles.button} onClick={handleGenerate}>
        {loading ? "Generating..." : "Generate"}
      </button>

      {result && (
        <div style={styles.result}>
          <div style={styles.previewWrapper}>
            
            {/* IMMAGINE BASE COLORI */}
            <img src={`${result}?q=40`} style={styles.image} />

            {/* META' DESTRA B/N */}
            <img src={`${result}?q=40`} style={styles.imageBW} />

            {/* WATERMARK PATTERN */}
            <div style={styles.watermarkPattern}>
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i}>
                  FILMFACE FILMFACE FILMFACE FILMFACE
                </div>
              ))}
            </div>

          </div>
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
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    border: "none",
    width: 200,
    textAlign: "center" as const,
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
  },
  imageBW: {
    position: "absolute" as const,
    top: 0,
    left: "50%",
    width: "50%",
    height: "100%",
    objectFit: "cover" as const,
    filter: "grayscale(100%)",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  watermarkPattern: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between",
    opacity: 0.15,
    transform: "rotate(-20deg)",
    pointerEvents: "none" as const,
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
};