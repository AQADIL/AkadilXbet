import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import { Plane, Circle } from "lucide-react";

const GAMES = [
  {
    href: "/fast-games/aviator",
    title: "Aviator",
    desc: "Rising multiplier · cash out before crash",
    icon: Plane,
    accent: "from-brand-primary/20 to-transparent",
  },
  {
    href: "/fast-games/balloon",
    title: "Balloon",
    desc: "Hold to pump · release to win",
    icon: Circle,
    accent: "from-brand-glow/15 to-transparent",
  },
] as const;

export default function FastGamesPage() {
  return (
    <MobileShell>
      <section className="px-4 pt-8 pb-6">
        <h1 className="text-brutalist text-3xl text-brand-glow glow-green mb-1">Fast Games</h1>
        <p className="text-text-muted text-sm mb-8">Instant rounds · server-side odds</p>

        <div className="flex flex-col gap-4">
          {GAMES.map(({ href, title, desc, icon: Icon, accent }) => (
            <Link
              key={href}
              href={href}
              className="group relative overflow-hidden rounded-2xl glass p-5 transition-all duration-200 active:scale-[0.98] hover:border-brand-glow/30"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-80`}
              />
              <div className="relative flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-primary/15 border border-glass">
                  <Icon size={28} className="text-brand-glow" strokeWidth={1.75} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-brutalist text-xl text-text-primary">{title}</p>
                  <p className="text-text-muted text-xs mt-1">{desc}</p>
                </div>
                <span className="text-brand-glow text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Play
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}
