"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function CustomPage() {
  const searchParams = useSearchParams();
  const poster = searchParams.get("poster");

  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // preview faccia
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
      throw new Error("Upload Cloudinary fallito");
    }

    return data.secure_url;
  };

  const handleGenerate = async () => {
    if (!faceFile || !poster) return;

    try {
      setLoading(true);
      setResult(null);

      // 1. upload faccia
      const faceUrl = await uploadToCloudinary(faceFile);

      // 2. trasformo poster locale in file
      const posterBlob = await fetch(poster).then((r) => r.blob());
      const posterFile = new File([posterBlob], "poster.jpg", {
        type: "image/jpeg",
      });

      // 3. upload poster su Cloudinary
      const targetUrl = await uploadToCloudinary(posterFile);

      console.log("FACE URL:", faceUrl);
      console.log("POSTER URL:", targetUrl);

      // 4. chiamata API
      const res = await fetch("/api/generate/roop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceImageUrl: faceUrl,
          targetImageUrl: targetUrl,
        }),
      });

      const data = await res.json();

      console.log("FULL RESPONSE:", data);

      let imageUrl: string | null = null;

      if (typeof data.image === "string") {
        imageUrl = data.image;
      } else if (Array.isArray(data.raw)) {
        const first = data.raw[0];
        if (typeof first === "string") imageUrl = first;
        if (first?.url) imageUrl = first.url;
      }

      if (imageUrl) {
        setResult(imageUrl);
      } else {
        alert("Errore output");
      }
    } catch (err) {
      console.error(err);
      alert("Errore durante la generazione");
    }

    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <h1>Customize</h1>

      {/* poster selezionato */}
      {poster && <img src={poster} style={styles.poster} />}

      {/* upload faccia */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          setFaceFile(e.target.files?.[0] || null)
        }
      />

      {/* preview */}
      {preview && <img src={preview} style={styles.preview} />}

      {/* bottone */}
      <button onClick={handleGenerate} style={styles.button}>
        {loading ? "Generating..." : "Generate"}
      </button>

      {/* risultato */}
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
  button: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    border: "none",
    background: "#6c5cff",
    color: "white",
    cursor: "pointer",
  },
};