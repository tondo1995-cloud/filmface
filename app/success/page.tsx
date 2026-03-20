"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import SuccessContent from "./SuccessContent";

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}