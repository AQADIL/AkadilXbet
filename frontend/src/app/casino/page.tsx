import MobileShell from "@/components/layout/MobileShell";
import Link from "next/link";

const GAMES = [
  {
    href: "/casino/slots",
    name: "Slots",
    tagline: "Spin the reels · Line up the win",
    badge: "CLASSIC",
    badgeColor: "text-purple-300 border-purple-400/40 bg-purple-400/10",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <rect x="4" y="10" width="40" height="28" rx="6" fill="#1a1a2e" stroke="#4ade80" strokeWidth="1.5"/>
        <rect x="10" y="15" width="8" height="18" rx="2" fill="#112A18" stroke="#4ade80" strokeWidth="1" opacity="0.8"/>
        <rect x="20" y="15" width="8" height="18" rx="2" fill="#112A18" stroke="#4ade80" strokeWidth="1" opacity="0.8"/>
        <rect x="30" y="15" width="8" height="18" rx="2" fill="#112A18" stroke="#4ade80" strokeWidth="1" opacity="0.8"/>
        <text x="14" y="28" textAnchor="middle" fontSize="10" fill="#fbbf24">7</text>
        <text x="24" y="28" textAnchor="middle" fontSize="10" fill="#4ade80">★</text>
        <text x="34" y="28" textAnchor="middle" fontSize="10" fill="#fbbf24">7</text>
        <rect x="4" y="22" width="40" height="1" fill="#4ade80" opacity="0.3"/>
      </svg>
    ),
    gradient: "from-purple-950/60 to-surface-raised/80",
    glow: "shadow-purple-900/30",
  },
  {
    href: "/casino/roulette",
    name: "Russian Roulette",
    tagline: "One bullet · Six chambers · Your call",
    badge: "HARDCORE",
    badgeColor: "text-red-400 border-red-400/40 bg-red-400/10",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="24" r="16" fill="#1a1a1a" stroke="#ef4444" strokeWidth="1.5"/>
        <circle cx="24" cy="13" r="3" fill="#374151"/>
        <circle cx="32.2" cy="17.5" r="3" fill="#374151"/>
        <circle cx="32.2" cy="30.5" r="3" fill="#ef4444" opacity="0.9"/>
        <circle cx="24" cy="35" r="3" fill="#374151"/>
        <circle cx="15.8" cy="30.5" r="3" fill="#374151"/>
        <circle cx="15.8" cy="17.5" r="3" fill="#374151"/>
        <circle cx="24" cy="24" r="4" fill="#1a1a1a" stroke="#6b7280" strokeWidth="1"/>
        <path d="M38 28 L46 32 L46 36 L44 36 L44 34 L38 31" fill="#4b5563"/>
      </svg>
    ),
    gradient: "from-red-950/50 to-surface-raised/80",
    glow: "shadow-red-900/40",
  },
] as const;

export default function CasinoPage() {
  return (
    <MobileShell>
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-brutalist text-2xl text-text-primary glow-green mb-1">Casino</h1>
        <p className="text-text-muted text-xs uppercase tracking-widest">High stakes · House rules</p>
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
