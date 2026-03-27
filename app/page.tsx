"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// 🔥 USIAMO SOLO FILE CHE ESISTONO
const posters = [
  {
    source: "/posters/wolf-dottore-del-b.jpg",
    example: "/examples/wolf-dottore-del-b-example.jpg",
    target: "/posters/wolf-dottore-del-b.jpg",
  },
  {
    source: "/posters/scusateilritardo-troisi.jpg",
    example: "/posters/scusateilritardo-troisi.jpg", // temporaneo
    target: "/posters/scusateilritardo-troisi.jpg",
  },
  {
    source: "/posters/scusateilritardo-woman.jpg",
    example: "/posters/scusateilritardo-woman.jpg", // temporaneo
    target: "/posters/scusateilritardo-woman.jpg",
  },
];

export default function Home() {
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div style={styles.page}>
      <p style={styles.hook}>
        😂 Il regalo più stupido (e perfetto) di sempre
      </p>

      <h1 style={styles.title}>FilmFace</h1>

      <p style={styles.subtitle}>
        Metti la faccia del tuo amico in un film in 5 secondi
      </p>

      <div style={styles.list}>
        {posters.map((p, i) => (
          <div key={i} style={styles.block}>
            
            <div
              style={{
                ...styles.row,
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <img src={p.source} style={styles.poster} />

              <img
                src="/symbols/green-arrow.png"
                style={{
                  ...styles.arrow,
                  transform: isMobile ? "rotate(90deg)" : "none",
                }}
              />

              <img src={p.example} style={styles.poster} />
            </div>

            <button
              style={styles.button}
              onClick={() =>
                router.push(`/custom?poster=${encodeURIComponent(p.target)}`)
              }
            >
              Crea
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
  },

  subtitle: {
    color: "#aaa",
    marginBottom: 40,
    marginTop: 10,
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 60,
    alignItems: "center",
  },

  block: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
  },

  row: {
    display: "flex",
    alignItems: "center",
    gap: 20,
  },

  poster: {
    width: 220,
    borderRadius: 12,
    background: "#1a1a1a",
    padding: 10,
  },

  arrow: {
    width: 80,
  },

  button: {
    padding: "14px 40px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #6c5cff, #8a7dff)",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 16,
  },
};