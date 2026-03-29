"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type ApiGenerateResponse = {
  preview?: string;
  hd?: string;
  error?: string;
};

export default function CustomContent() {
  const searchParams = useSearchParams();
  const rawPoster = searchParams.get("poster") ?? null;

  // decode defensively (in caso sia urlencoded)
  const poster = useMemo(() => {
    if (!rawPoster) return null;
    try {
      return decodeURIComponent(rawPoster);
    } catch {
      return rawPoster;
    }
  }, [rawPoster]);

  // Cloudinary base (client-safe env vars must be NEXT_PUBLIC_*)
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_BASE = CLOUD_NAME
    ? `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`
    : "";

  // If poster is an absolute url (startsWith http) use it directly,
  // otherwise assume it's a path like "/filmface/posters/xxx.jpg" and prepend Cloudinary base.
  const cloudPoster = useMemo(() => {
    if (!poster) return null;
    const trimmed = poster.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    const suffix = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return CLOUDINARY_BASE ? `${CLOUDINARY_BASE}${suffix}` : null;
  }, [poster, CLOUDINARY_BASE]);

  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [hdUrl, setHdUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // createObjectURL preview + cleanup
  useEffect(() => {
    if (!faceFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(faceFile);
    setPreview(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreview(null);
    };
  }, [faceFile]);

  const uploadToCloudinary = async (file: File) => {
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!preset || !CLOUD_NAME)
      throw new Error("Cloudinary config mancante (NEXT_PUBLIC_... vars).");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Upload fallito: ${res.status} ${txt}`);
    }

    const data = await res.json();
    if (!data.secure_url) throw new Error("Upload fallito: missing secure_url");
    return data.secure_url as string;
  };

  const handleGenerate = async () => {
    setErrorMsg(null);

    if (!faceFile) {
      setErrorMsg("Carica una foto prima di generare.");
      return;
    }

    if (!cloudPoster) {
      setErrorMsg("Poster non valido o Cloudinary non configurato correttamente.");
      return;
    }

    setLoading(true);
    setResult(null);
    setHdUrl(null);

    try {
      if (faceFile.size > 15 * 1024 * 1024) {
        throw new Error("File troppo grande. Limite 15MB.");
      }

      // 1) upload volto
      const faceUrl = await uploadToCloudinary(faceFile);

      // 2) call generation endpoint (server handles Replicate/ROOP)
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

      const data: ApiGenerateResponse = await res.json();

      if (!res.ok) {
        const msg = data?.error ?? `Errore server: ${res.status}`;
        throw new Error(msg);
      }

      if (!data.preview) throw new Error("Generazione fallita (nessuna preview).");

      setResult(data.preview || null);
      setHdUrl(data.hd || null);
    } catch (err: any) {
      console.error("generate error", err);
      setErrorMsg(err?.message ?? "Errore durante la generazione.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setErrorMsg(null);

    if (!hdUrl) {
      setErrorMsg("HD non disponibile. Genera prima la preview.");
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

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Checkout fallito: ${res.status} ${txt}`);
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Risposta checkout non valida.");
      }
    } catch (err: any) {
      console.error("checkout error", err);
      setErrorMsg(err?.message ?? "Errore pagamento.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Trasforma il tuo amico in una leggenda</h1>

        {!cloudPoster && (
          <div style={styles.warning}>
            Poster non valido. Controlla il link dalla home o passa a un poster valido.
          </div>
        )}

        {cloudPoster && (
          <img
            src={cloudPoster}
            alt="Poster target"
            style={styles.poster}
            onError={() => setErrorMsg("Impossibile caricare il poster selezionato.")}
          />
        )}

        <div style={{ marginTop: 12 }} />

        <label style={styles.uploadButton}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setErrorMsg(null);
              const f = e.target.files?.[0] ?? null;
              setFaceFile(f);
            }}
            style={{ display: "none" }}
          />
          {faceFile ? "Volto caricato ✅" : "Carica una foto"}
        </label>

        {preview && <img src={preview} alt="preview" style={styles.preview} />}

        {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

        <button
          style={{ ...styles.button, opacity: loading ? 0.8 : 1 }}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Creazione in corso..." : "Genera gratis"}
        </button>

        {result && (
          <div style={styles.result}>
            <img src={result} alt="preview result" style={styles.image} />

            <div style={styles.ctaBox}>
              <p style={styles.ctaText}>Scarica la versione HD senza watermark</p>

              <button
                style={{
                  ...styles.unlockButton,
                  opacity: hdUrl ? 1 : 0.8,
                  cursor: hdUrl ? "pointer" : "not-allowed",
                }}
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

const styles: Record<string, any> = {
  page: {
    minHeight: "100vh",
    background: "#0b0b0f",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontFamily: "var(--font-inter)",
    padding: 20,
  },

  container: {
    width: 360,
    textAlign: "center",
  },

  title: {
    marginBottom: 12,
    fontWeight: 700,
    fontSize: 20,
  },

  warning: {
    marginBottom: 12,
    padding: 10,
    background: "#2b1a1a",
    borderRadius: 8,
    color: "#ffcc00",
  },

  poster: {
    width: "100%",
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
  },

  uploadButton: {
    display: "inline-block",
    padding: 12,
    borderRadius: 12,
    background: "white",
    color: "black",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
  },

  preview: {
    width: 100,
    marginTop: 10,
    borderRadius: 10,
  },

  button: {
    marginTop: 18,
    padding: 12,
    borderRadius: 12,
    background: "#6c5cff",
    color: "white",
    width: "100%",
    cursor: "pointer",
    fontWeight: 700,
    border: "none",
  },

  result: {
    marginTop: 22,
  },

  image: {
    width: "100%",
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
  },

  ctaBox: {
    marginTop: 14,
    padding: 14,
    background: "#111",
    borderRadius: 12,
  },

  ctaText: {
    fontSize: 14,
    marginBottom: 10,
    opacity: 0.9,
  },

  unlockButton: {
    padding: 12,
    borderRadius: 10,
    background: "#00c853",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    width: "100%",
    border: "none",
  },

  errorBox: {
    marginTop: 12,
    padding: 10,
    background: "#3a1f1f",
    color: "#ff7b7b",
    borderRadius: 8,
  },
};