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
      <h1 style={styles.title}>FaceFilm</h1>
      <p style={styles.subtitle}>
        Choose a scene and become the main character
      </p>

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
              Personalizza
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
  },
  title: {
    fontSize: 32,
  },
  subtitle: {
    color: "#aaa",
    marginBottom: 30,
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
    padding: 10,
    borderRadius: 8,
    border: "none",
    background: "#6c5cff",
    color: "white",
    cursor: "pointer",
  },
};