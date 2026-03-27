"use client";

import { useRouter } from "next/navigation";

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
            
            {/* PRIMA / DOPO */}
            <div style={styles.row}>
              <img src={p.source} style={styles.posterLeft} />
              <img src={p.example} style={styles.posterRight} />

              {/* FRECCIA */}
              <img
                src="/symbols/green-arrow.png"
                style={styles.arrowOverlay}
              />
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
    gap: 70,
    alignItems: "center",
  },

  block: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
  },

  row: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // 🔥 SINISTRA (70%)
  posterLeft: {
    width: 150,
    borderRadius: 12,
    zIndex: 1,
    display: "block",
  },

  // 🔥 DESTRA (OVERLAP + FOCUS)
  posterRight: {
    width: 240,
    borderRadius: 12,
    marginLeft: -60, // overlap più deciso
    zIndex: 2,
    display: "block",
  },

  // 🔥 FRECCIA OVERLAY PERFETTA
  arrowOverlay: {
    position: "absolute",
    width: 90,
    left: "50%",
    top: "50%",
    transform: "translate(-20%, -50%)",
    pointerEvents: "none",
    zIndex: 3,
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