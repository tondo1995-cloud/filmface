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
      const faceUrl = await uploadToCloudinary(faceFile);

      const res = await fetch("/api/generate/roop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceImageUrl: faceUrl,
          targetImageUrl: poster,
        }),
      });

      const data = await res.json();

      let imageUrl = null;

      if (typeof data.image === "string") imageUrl = data.image;
      else if (data.raw?.[0]?.url) imageUrl = data.raw[0].url;

      setResult(imageUrl);
    } catch (err) {
      console.error(err);
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

      {result && <img src={result} style={styles.result} />}
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