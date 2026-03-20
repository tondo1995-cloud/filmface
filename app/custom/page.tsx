"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import CustomContent from "./CustomPageContent";

export default function CustomPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f" }}>
      <Suspense fallback={<div style={{ color: "white", padding: 40 }}>Loading...</div>}>
        <CustomContent />
      </Suspense>
    </div>
  );
}