"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Zap, Spade, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/fast-games", label: "Fast Games", icon: Zap },
  { href: "/casino", label: "Casino", icon: Spade },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-heavy border-t border-green-800/30 backdrop-blur-md bg-green-950/50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 safe-area-bottom">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full group"
            >
              <span
                className={`flex items-center justify-center w-10 h-7 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-brand-primary/15"
                    : "group-hover:bg-white/5"
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.75}
                  className={`transition-colors duration-200 ${
                    isActive
                      ? "text-brand-glow"
                      : "text-text-muted group-hover:text-text-secondary"
                  }`}
                />
              </span>
              <span
                className={`text-[10px] font-semibold tracking-wide uppercase transition-colors duration-200 ${
                  isActive ? "text-brand-glow" : "text-text-muted group-hover:text-text-secondary"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
