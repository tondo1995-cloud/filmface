"use client";

import { useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";

const posters = [
  {
    source: "/posters/wolf-dottore-del-b.jpg",
    example: "/examples/wolf-dottore-del-b-example.jpg",
    target: "/filmface/posters/wolf-dottore-del-b.jpg",
  },
  {
    source: "/posters/scusateilritardo-troisi.jpg",
    example: "/examples/scusateilritardo-troisi-example.jpg",
    target: "/filmface/posters/scusateilritardo-troisi.jpg",
  },
  {
    source: "/posters/scusateilritardo-woman.jpg",
    example: "/examples/scusateilritardo-woman-example.jpg",
    target: "/filmface/posters/scusateilritardo-woman.jpg",
  },
  {
    source: "/posters/pulpfiction-man.jpg",
    example: "/examples/pulpfiction-man-example.jpg",
    target: "/filmface/posters/pulpfiction-man.jpg",
  },
  {
    source: "/posters/pulpfiction-woman.jpg",
    example: "/examples/pulpfiction-woman-example.jpg",
    target: "/filmface/posters/pulpfiction-woman.jpg",
  },
];

export default function Home() {
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 900);
    };

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

      <div
        style={{
          ...styles.grid,
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
        }}
      >
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

      const targetX = right.left - row.left;
      const targetY = right.top - row.top + right.height / 2;

      setPos({
        x: targetX - arrowWidth / 2,
        y: targetY - arrowHeight / 2,
      });
    };

    const timeout = setTimeout(update, 80);

    window.addEventListener("resize", update);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div style={styles.block}>
      <div style={styles.row} ref={rowRef}>
        <img
          src={p.source}
          style={styles.posterLeft}
          onError={(e: any) => (e.currentTarget.style.display = "none")}
        />

        <img
          src={p.example}
          style={styles.posterRight}
          ref={rightRef}
          onError={(e: any) => (e.currentTarget.style.display = "none")}
        />

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
        PERSONALIZZA ORA GRATIS
      </button>
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    background: "#0f0f0f",
    padding: "40px 16px",
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
    fontSize: 36,
    fontWeight: 700,
    fontFamily: "var(--font-grotesk)",
  },

  subtitle: {
    color: "#aaa",
    marginBottom: 30,
    marginTop: 10,
  },

  grid: {
    display: "grid",
    gap: 40,
    maxWidth: 1100,
    margin: "0 auto",
  },

  block: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },

  row: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  posterLeft: {
    width: "40%",
    maxWidth: 140,
    objectFit: "cover",
    boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
  },

  posterRight: {
    width: "60%",
    maxWidth: 220,
    marginLeft: -20,
    objectFit: "cover",
    boxShadow: "0 20px 40px rgba(0,0,0,0.7)",
  },

  arrowOverlay: {
    position: "absolute",
    width: 60,
    pointerEvents: "none",
    zIndex: 3,
  },

  button: {
    padding: "14px 20px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #6c5cff, #8a7dff)",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    width: "100%",
    maxWidth: 280,
  },
};