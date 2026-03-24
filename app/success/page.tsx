import { Suspense } from "react";
import SuccessContent from "./SuccessContent";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}