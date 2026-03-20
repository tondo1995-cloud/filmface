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
    return data.secure_url;
  };

  const handleGenerate = async () => {
    if (!faceFile || !poster) return;

    setLoading(true);

    try {
      // Upload faccia
      const faceUrl = await uploadToCloudinary(faceFile);

      // FIX IMPORTANTE: poster pubblico
      const publicPosterUrl = `${window.location.origin}${poster}`;

      console.log("FACE URL:", faceUrl);
      console.log("POSTER URL:", publicPosterUrl);

      const res = await fetch("/api/generate/roop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceImageUrl: faceUrl,
          targetImageUrl: publicPosterUrl,
        }),
      });

      const data = await res.json();

      console.log("API RESPONSE:", data);

      let imageUrl =
        data?.image ||
        data?.output?.[0] ||
        data?.data?.[0]?.url ||
        data?.raw?.[0]?.url ||
        null;

      if (!imageUrl) {
        alert("Errore: nessuna immagine ricevuta");
      }

      setResult(imageUrl);
    } catch (err) {
      console.error("ERROR:", err);
    }

    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <h1>Customize</h1>

      {poster && <img src={poster} style={styles.poster} />}

      <input
        type="file"
        onChange={(e) => setFaceFile(e.target.files?.[0] || null)}
      />

      {preview && <img src={preview} style={styles.preview} />}

      <button onClick={handleGenerate}>
        {loading ? "Generating..." : "Generate"}
      </button>

      {result && (
        <>
          <img src={result} style={styles.result} />

          <a
            href={result}
            download
            style={{
              display: "inline-block",
              marginTop: 10,
              padding: 10,
              background: "#00c853",
              color: "white",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Download Image
          </a>
        </>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: 40,
    textAlign: "center" as const,
  },
  poster: {
    width: 200,
    marginBottom: 20,
  },
  preview: {
    width: 150,
    marginTop: 10,
  },
  result: {
    width: 300,
    marginTop: 20,
  },
};