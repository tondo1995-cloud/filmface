"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import CustomContent from "./CustomPageContent";

function LoadingFallback() {
  return (
    <div style={styles.loader}>
      <div style={styles.loaderInner}>
        <div style={styles.loaderTitle}>FilmFace</div>
        <div style={styles.loaderText}>Caricamento...</div>
      </div>
    </div>
  );
}

export default function CustomPage() {
  return (
    <div style={styles.page}>
      <Suspense fallback={<LoadingFallback />}>
        <CustomContent />
      </Suspense>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f0f0f",
  },

  loader: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f0f0f",
    color: "white",
  },

  loaderInner: {
    textAlign: "center" as const,
  },

  loaderTitle: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 10,
    opacity: 0.9,
  },

  loaderText: {
    fontSize: 14,
    opacity: 0.6,
  },
};