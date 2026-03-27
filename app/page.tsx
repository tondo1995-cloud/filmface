"use client";

import { useRouter } from "next/navigation";

// ✅ SOLO LOCANDINE 2,5,6
const posters = [
  "/posters/wolf-fumatore.jpg",
  "/posters/scusateilritardo-troisi.jpg",
  "/posters/scusateilritardo-woman.jpg",
];

export default function Home() {
  const router = useRouter();

  return (
    <div style={styles.page}>
      {/* HOOK */}
      <p style={styles.hook}>
        😂 Il regalo più stupido (e perfetto) di sempre
      </p>

      {/* BRAND */}
      <h1 style={styles.title}>FilmFace</h1>

      {/* VALUE */}
      <p style={styles.subtitle}>
        Metti la faccia del tuo amico in un film in 5 secondi
      </p>

      {/* GRID */}
      <div style={styles.grid}>
        {posters.map((poster, i) => (
          <div key={i} style={styles.card}>
            <img src={poster} style={styles.image} />

            <button
              style={styles.button}
              onClick={() =>
                router.push(`/custom?poster=${encodeURIComponent(poster)}`)
              }
            >
              Crea immagine
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    background: "#0f0f0f",
    padding: 40,
    textAlign: "center",
    color: "white",
    fontFamily: "var(--font-inter)",
  },

  hook: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 10,
  },

  title: {
    fontSize: 42,
    fontWeight: 700,
    fontFamily: "var(--font-grotesk)",
    letterSpacing: -0.5,
  },

  subtitle: {
    color: "#aaa",
    marginBottom: 30,
    marginTop: 10,
    fontSize: 16,
  },

  // 🔥 GRID CONTROLLATA
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 220px)", // max 4 per riga
    justifyContent: "space-between", // distribuite su tutta larghezza
    rowGap: 30,
    width: "100%",
    maxWidth: 1000,
    margin: "0 auto",
  },

  card: {
    background: "#1a1a1a",
    padding: 10,
    borderRadius: 14,
  },

  image: {
    width: "100%",
    borderRadius: 10,
  },

  button: {
    marginTop: 12,
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #6c5cff, #8a7dff)",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
};