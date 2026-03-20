"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import CustomContent from "./CustomPageContent";

export default function CustomPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomContent />
    </Suspense>
  );
}