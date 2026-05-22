"use client";

import MobileShell from "@/components/layout/MobileShell";
import AviatorGame from "@/components/aviator/AviatorGame";

export default function AviatorPage() {
  return (
    <MobileShell flush>
      <AviatorGame />
    </MobileShell>
  );
}
