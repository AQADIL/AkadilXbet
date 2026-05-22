"use client";

import MobileShell from "@/components/layout/MobileShell";
import BalloonGame from "@/components/balloon/BalloonGame";

export default function BalloonPage() {
  return (
    <MobileShell flush>
      <BalloonGame />
    </MobileShell>
  );
}
