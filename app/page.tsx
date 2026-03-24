"use client";

import { useRouter } from "next/navigation";

const posters = [
  "/posters/dallas.jpg",
  "/posters/wolf-fumatore.jpg",
  "/posters/wanted.jpg",
  "/posters/netflix.jpg",
];

export default function Home() {
  const router = useRouter();

  return (
    <div style={styles.page}>
      {/* 🔥 HOOK */}
      <p style={styles.hook}>
        😂 Il regalo più stupido (e perfetto) di sempre
      </p>

      {/* 🔥 BRAND */}
      <h1 style={styles.title}>FilmFace</h1>

      {/* 🔥 VALUE PROP */}
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

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f0f0f",
    padding: 40,
    textAlign: "center" as const,
    color: "white",
  },

  hook: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 10,
  },

  title: {
    fontSize: 36,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#aaa",
    marginBottom: 30,
    marginTop: 10,
    fontSize: 16,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 20,
  },

  card: {
    background: "#1a1a1a",
    padding: 10,
    borderRadius: 12,
  },

  image: {
    width: "100%",
    borderRadius: 8,
  },

  button: {
    marginTop: 10,
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#6c5cff",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
};