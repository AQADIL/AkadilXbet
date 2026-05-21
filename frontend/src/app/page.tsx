"use client";

import MobileShell from "@/components/layout/MobileShell";
import HeroSection from "@/components/sections/HeroSection";
import AuthenticatedHome from "@/components/sections/AuthenticatedHome";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <MobileShell>
      {user ? <AuthenticatedHome user={user} /> : <HeroSection />}
    </MobileShell>
  );
}
