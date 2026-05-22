import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";

const games = [
    {
        title: "Mines",
        href: "/fast-games/mines",
        emoji: "💣",
        description: "Open safe cells and cashout before hitting a mine.",
    },
    {
        title: "Dice",
        href: "/fast-games/dice",
        emoji: "🎲",
        description: "Roll the dice. 4, 5 or 6 gives x2 payout.",
    },
];

export default function FastGamesPage() {
    return (
        <MobileShell>
            <div className="min-h-[calc(100svh-4rem)] px-4 py-6">
                <p className="text-xs uppercase tracking-[0.3em] text-green-400/70">
                    AkadilXbet
                </p>

                <h1 className="mt-1 text-4xl font-black text-white">Fast Games</h1>

                <p className="mt-2 text-sm text-white/40">
                    Choose a quick game and start playing.
                </p>

                <div className="mt-6 grid gap-4">
                    {games.map((game) => (
                        <Link
                            key={game.title}
                            href={game.href}
                            className="group rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl transition hover:border-green-400/40 hover:bg-green-400/10"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-black/40 text-4xl shadow-lg">
                                    {game.emoji}
                                </div>

                                <div className="flex-1">
                                    <h2 className="text-2xl font-black text-white">
                                        {game.title}
                                    </h2>
                                    <p className="mt-1 text-sm text-white/40">
                                        {game.description}
                                    </p>
                                </div>

                                <span className="text-2xl text-green-400 transition group-hover:translate-x-1">
                  →
                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </MobileShell>
    );
}