import MobileShell from "@/components/layout/MobileShell";
import Link from "next/link";

const GAMES = [
  {
    href: "/fast-games/aviator",
    name: "Aviator",
    tagline: "Fly high, cash out before the crash",
    badge: "HOT",
    badgeColor: "text-red-400 border-red-400/40 bg-red-400/10",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <path d="M6 28L22 8l4 8 12-4-14 18-4-8-14 6z" fill="#4ade80" opacity="0.9"/>
        <path d="M28 32l8-4-2 10-6-6z" fill="#4ade80" opacity="0.5"/>
        <circle cx="38" cy="38" r="2" fill="#4ade80" opacity="0.4"/>
        <circle cx="42" cy="36" r="1.5" fill="#4ade80" opacity="0.3"/>
        <circle cx="44" cy="40" r="1" fill="#4ade80" opacity="0.2"/>
      </svg>
    ),
    gradient: "from-green-950/80 to-surface-raised/80",
    glow: "shadow-green-900/40",
  },
  {
    href: "/fast-games/balloon",
    name: "Balloon",
    tagline: "Inflate the risk, release the reward",
    badge: "NEW",
    badgeColor: "text-brand-glow border-brand-glow/40 bg-brand-glow/10",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <ellipse cx="24" cy="20" rx="13" ry="15" fill="#4ade80" opacity="0.85"/>
        <ellipse cx="20" cy="14" rx="4" ry="5" fill="white" opacity="0.25"/>
        <path d="M21 35 Q24 40 27 35" stroke="#4ade80" strokeWidth="1.5" fill="none" opacity="0.7"/>
        <rect x="22" y="35" width="4" height="2" rx="1" fill="#4ade80" opacity="0.5"/>
        <path d="M24 37 L22 44 M24 37 L26 44" stroke="#22c55e" strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
    gradient: "from-emerald-950/80 to-surface-raised/80",
    glow: "shadow-emerald-900/40",
  },
  {
    href: "/fast-games/scratch",
    name: "Scratch Loto",
    tagline: "Three matching symbols — instant win",
    badge: "LUCK",
    badgeColor: "text-text-gold border-text-gold/40 bg-text-gold/10",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <rect x="6" y="8" width="36" height="32" rx="5" fill="#1a3d22" stroke="#4ade80" strokeWidth="1.5" opacity="0.8"/>
        <rect x="10" y="13" width="10" height="10" rx="2" fill="#4ade80" opacity="0.3"/>
        <rect x="23" y="13" width="10" height="10" rx="2" fill="#4ade80" opacity="0.3"/>
        <rect x="10" y="27" width="10" height="10" rx="2" fill="#4ade80" opacity="0.3"/>
        <rect x="23" y="27" width="10" height="10" rx="2" fill="#fbbf24" opacity="0.5"/>
        <circle cx="39" cy="18" r="5" fill="#fbbf24" opacity="0.9"/>
        <path d="M36.5 18 Q39 15.5 41.5 18" stroke="white" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    gradient: "from-yellow-950/60 to-surface-raised/80",
    glow: "shadow-yellow-900/30",
  },
] as const;

export default function FastGamesPage() {
  return (
    <MobileShell>
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-brutalist text-2xl text-text-primary glow-green mb-1">Fast Games</h1>
        <p className="text-text-muted text-xs uppercase tracking-widest">Quick rounds · Instant payouts</p>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-6">
        {GAMES.map((game) => (
          <Link
            key={game.href}
            href={game.href}
            className={`group relative overflow-hidden rounded-2xl glass bg-gradient-to-br ${game.gradient} border border-green-800/30 shadow-xl ${game.glow} active:scale-[0.98] transition-transform duration-150`}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/[0.02]" />
            <div className="relative flex items-center gap-4 p-5">
              <div className="shrink-0 w-16 h-16 rounded-xl glass flex items-center justify-center">
                {game.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-text-primary font-black text-lg tracking-tight">{game.name}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${game.badgeColor}`}>
                    {game.badge}
                  </span>
                </div>
                <p className="text-text-muted text-xs leading-snug">{game.tagline}</p>
              </div>
              <svg className="w-5 h-5 text-text-muted group-hover:text-text-secondary transition-colors shrink-0" viewBox="0 0 20 20" fill="none">
                <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}
