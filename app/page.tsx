"use client";

import { useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";

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

      <div style={styles.grid}>
        {posters.map((p, i) => (
          <PosterBlock key={i} p={p} router={router} />
        ))}
      </div>
    </div>
  );
}

function PosterBlock({ p, router }: any) {
  const rowRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLImageElement>(null);
  const arrowRef = useRef<HTMLImageElement>(null);

  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const update = () => {
      if (!rowRef.current || !rightRef.current || !arrowRef.current) return;

      const row = rowRef.current.getBoundingClientRect();
      const right = rightRef.current.getBoundingClientRect();

      const arrowWidth = arrowRef.current.offsetWidth;
      const arrowHeight = arrowRef.current.offsetHeight;

      // 👉 bordo sinistro poster destro
      const targetX = right.left - row.left;

      // 👉 centro verticale poster destro
      const targetY = right.top - row.top + right.height / 2;

      setPos({
        x: targetX - arrowWidth / 2,
        y: targetY - arrowHeight / 2,
      });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div style={styles.block}>
      <div style={styles.row} ref={rowRef}>
        <img src={p.source} style={styles.posterLeft} />
        <img src={p.example} style={styles.posterRight} ref={rightRef} />

        <img
          ref={arrowRef}
          src="/symbols/green-arrow.png"
          style={{
            ...styles.arrowOverlay,
            left: pos.x,
            top: pos.y,
          }}
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

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 60,
    maxWidth: 1100,
    margin: "0 auto",
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

  posterLeft: {
    width: 150,
    borderRadius: 0,
    zIndex: 1,
  },

  posterRight: {
    width: 230,
    borderRadius: 0,
    marginLeft: -35,
    zIndex: 2,
  },

  arrowOverlay: {
    position: "absolute",
    width: 80,
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