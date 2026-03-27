"use client";

import { useRouter } from "next/navigation";

// 🔥 USIAMO SOLO FILE CHE ESISTONO
const posters = [
  {
    source: "/posters/wolf-dottore-del-b.jpg",
    example: "/examples/wolf-dottore-del-b-example.jpg",
    target: "/posters/wolf-dottore-del-b.jpg",
  },
  {
    source: "/posters/scusateilritardo-troisi.jpg",
    example: "/posters/scusateilritardo-troisi.jpg",
    target: "/posters/scusateilritardo-troisi.jpg",
  },
  {
    source: "/posters/scusateilritardo-woman.jpg",
    example: "/posters/scusateilritardo-woman.jpg",
    target: "/posters/scusateilritardo-woman.jpg",
  },
];

export default function Home() {
  const router = useRouter();

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
            
            {/* 🔥 PRIMA / DOPO */}
            <div style={styles.row}>
              <img src={p.source} style={styles.posterSmall} />
              <img src={p.example} style={styles.posterBig} />

              {/* 🔥 FRECCIA OVERLAY */}
              <img
                src="/symbols/green-arrow.png"
                style={styles.arrowOverlay}
              />
            </div>

            {/* CTA */}
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

  // 🔥 IMMAGINI ATTACCATE
  row: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 0,
  },

  // 🔥 SINISTRA (70%)
  posterSmall: {
    width: 160,
    borderRadius: 12,
    background: "#1a1a1a",
    padding: 10,
  },

  // 🔥 DESTRA (FOCUS)
  posterBig: {
    width: 220,
    borderRadius: 12,
    background: "#1a1a1a",
    padding: 10,
  },

  // 🔥 FRECCIA CENTRATA MA LEGGERMENTE VERSO OUTPUT
  arrowOverlay: {
    position: "absolute",
    width: 100,
    left: "50%",
    top: "50%",
    transform: "translate(-40%, -50%)",
    pointerEvents: "none",
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