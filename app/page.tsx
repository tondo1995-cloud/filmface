"use client";

import { useRouter } from "next/navigation";
import { useRef, useEffect, useState, CSSProperties } from "react";

type Poster = {
  thumb: string;
  example: string;
  target: string;
};

type PosterBlockProps = {
  p: Poster;
  router: ReturnType<typeof useRouter>;
};

type Review = {
  rating: number;
  text: string;
};

const posters: Poster[] = [
  {
    thumb: "/thumbs/oscars-woman-visualizzaesparisce.jpg",
    example: "/examples/oscars-woman-visualizzaesparisce-example.jpg",
    target: "/filmface/posters/oscars-woman-visualizzaesparisce.jpg",
  },
  {
    thumb: "/thumbs/scusateilritardo-troisi.jpg",
    example: "/examples/scusateilritardo-troisi-example.jpg",
    target: "/filmface/posters/scusateilritardo-troisi.jpg",
  },
  {
    thumb: "/thumbs/scusateilritardo-woman.jpg",
    example: "/examples/scusateilritardo-woman-example.jpg",
    target: "/filmface/posters/scusateilritardo-woman.jpg",
  },
  {
    thumb: "/thumbs/wolf-fumatore-dell-anno.jpg",
    example: "/examples/wolf-fumatore-dell-anno-example.jpg",
    target: "/filmface/posters/wolf-fumatore-dell-anno.jpg",
  },
  {
    thumb: "/thumbs/wolf-dottore-del-b.jpg",
    example: "/examples/wolf-dottore-del-b-example.jpg",
    target: "/filmface/posters/wolf-dottore-del-b.jpg",
  },
  {
    thumb: "/thumbs/pulpfiction-man.jpg",
    example: "/examples/pulpfiction-man-example.jpg",
    target: "/filmface/posters/pulpfiction-man.jpg",
  },
  {
    thumb: "/thumbs/pulpfiction-woman.jpg",
    example: "/examples/pulpfiction-woman-example.jpg",
    target: "/filmface/posters/pulpfiction-woman.jpg",
  },
  {
    thumb: "/thumbs/oscars-woman-awards1.jpg",
    example: "/examples/oscars-woman-awards1-example.jpg",
    target: "/filmface/posters/oscars-woman-awards1.jpg",
  },  {
    thumb: "/thumbs/oscars-man-awards1.jpg",
    example: "/examples/oscars-man-awards1-example.jpg",
    target: "/filmface/posters/oscars-man-awards1.jpg",
  },
  {
    thumb: "/thumbs/trainspotting-man-1.jpg",
    example: "/examples/trainspotting-man-1-example.jpg",
    target: "/filmface/posters/trainspotting-man-1.jpg",
  },
];

function ReviewsTicker() {
  const reviews: Review[] = [
    { rating: 5, text: "Il gruppo whatsapp è impazzito hahahah" },
    { rating: 4.5, text: "Regalo più stupido e più riuscito mai fatto." },
    { rating: 5, text: "Story Instagram = 30 risposte" },
    { rating: 4, text: "vale anche solo per la reazione" },
    { rating: 5, text: "nessuna decrizione" },
    { rating: 4.5, text: "sto spendendo milioni su questo sito help" },
  ];

  const loop = [...reviews, ...reviews];

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 !== 0;
    const empty = 5 - full - (half ? 1 : 0);

    return (
      <>
        {"★".repeat(full)}
        {half ? "☆" : ""}
        {"☆".repeat(empty)}
      </>
    );
  };

  return (
    <>
      <div style={styles.tickerOuter}>
        <div style={styles.tickerTrack}>
          {loop.map((item, i) => (
            <div key={i} style={styles.tickerItem}>
              <div style={styles.tickerStars}>{renderStars(item.rating)}</div>
              <div style={styles.tickerText}>{item.text}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scrollTicker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
      `}</style>
    </>
  );
}

export default function Home() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const images = Array.from(document.images);
    let loaded = 0;

    if (images.length === 0) {
      setReady(true);
      return;
    }

    const onLoad = () => {
      loaded++;
      if (loaded === images.length) {
        setTimeout(() => setReady(true), 200);
      }
    };

    images.forEach((img) => {
      if (img.complete) onLoad();
      else {
        img.addEventListener("load", onLoad);
        img.addEventListener("error", onLoad);
      }
    });
  }, []);

  if (!ready) {
    return <div style={styles.loader}>FilmFace</div>;
  }

  return (
    <div style={styles.pageFade}>
      <div style={styles.page}>
        <p style={styles.hook}>
          😂 Il regalo più stupido (e perfetto) di sempre
        </p>

        <img
          src="/symbols/logo-arcade-filmface.png"
          alt="FilmFace"
          style={styles.logo}
        />

        <p style={styles.subtitle}>
          Metti la faccia del tuo amico in un film in 5 secondi
        </p>

        <ReviewsTicker />

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
    </div>
  );
}

function PosterBlock({ p, router }: PosterBlockProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLImageElement | null>(null);
  const arrowRef = useRef<HTMLImageElement | null>(null);

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
        <img src={p.thumb} style={styles.posterLeft} />

        <img
          src={p.example}
          style={styles.posterRight}
          ref={rightRef}
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

const styles: Record<string, CSSProperties> = {
  loader: {
    height: "100vh",
    background: "#0f0f0f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: 20,
    fontWeight: 600,
  },

  pageFade: {
    animation: "fadeIn 0.4s ease",
  },

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

  logo: {
    width: 180,
    maxWidth: "80%",
    margin: "10px auto 20px",
    display: "block",
  },

  subtitle: {
    color: "#aaa",
    marginBottom: 20,
    marginTop: 10,
  },

  tickerOuter: {
    overflow: "hidden",
    background: "#000",
    padding: "10px 0",
    borderTop: "1px solid #222",
    borderBottom: "1px solid #222",
    marginBottom: 20,
  },

  tickerTrack: {
    display: "flex",
    width: "max-content",
    animation: "scrollTicker 20s linear infinite",
  },

  tickerItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginRight: 60,
    minWidth: 180,
  },

  tickerStars: {
    color: "#FFD700",
    fontSize: 14,
    marginBottom: 4,
  },

  tickerText: {
    fontSize: 13,
    opacity: 0.9,
    textAlign: "center",
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
  },

  posterRight: {
    width: "60%",
    maxWidth: 220,
    marginLeft: -20,
    objectFit: "cover",
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