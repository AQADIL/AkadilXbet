import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import DiceGame from "@/components/game/DiceGame";

export default function DicePage() {
    return (
        <MobileShell>
            <div className="min-h-[calc(100svh-4rem)] px-4 py-6">
                <Link href="/fast-games" className="text-sm font-bold text-green-400">
                    ← Back to Fast Games
                </Link>

                <div className="mt-5">
                    <DiceGame />
                </div>
            </div>
        </MobileShell>
    );
}