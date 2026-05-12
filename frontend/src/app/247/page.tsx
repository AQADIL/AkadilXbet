import MobileShell from "@/components/layout/MobileShell";
import GoalGame from "@/components/game/GoalGame";
import { Timer } from "lucide-react";

export default function BetsPage() {
  return (
    <MobileShell>
      <div className="flex flex-col gap-4 px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg glass border border-brand-primary/20">
            <Timer size={18} className="text-brand-glow" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-brutalist text-base text-text-primary tracking-widest">
              24/7 Bets
            </h1>
            <p className="text-text-muted text-xs">Goal or No Goal</p>
          </div>
        </div>

        <GoalGame />
      </div>
    </MobileShell>
  );
}
