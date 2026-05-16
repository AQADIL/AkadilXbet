"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Zap, Timer, Dices, User, Layers } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/fast-games", label: "Fast Games", icon: Zap },
  { href: "/247", label: "24/7", icon: Timer },
  { href: "/blackjack", label: "BlackJack", icon: Layers },
  { href: "/casino", label: "Casino", icon: Dices },
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
                className={`flex items-center justify-center rounded-lg transition-all duration-200 ${
                  href === "/blackjack" ? "w-20 h-9" : "w-16 h-7"
                } ${
                  isActive
                    ? "bg-brand-primary/15"
                    : "group-hover:bg-white/5"
                }`}
              >
                {href === "/blackjack" ? (
                  <img 
                    src="/videos/blackjack/blackjack_logo_trans.png" 
                    alt="BJ" 
                    className={`h-7 w-full object-contain transition-all duration-200 ${isActive ? "opacity-100 drop-shadow-[0_0_12px_rgba(74,222,128,0.8)]" : "opacity-40 grayscale group-hover:opacity-70 group-hover:grayscale-0"}`} 
                  />
                ) : (
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 1.75}
                    className={`transition-colors duration-200 ${
                      isActive
                        ? "text-brand-glow"
                        : "text-text-muted group-hover:text-text-secondary"
                    }`}
                  />
                )}
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
