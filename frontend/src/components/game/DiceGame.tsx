"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type DiceHistoryItem = {
    dice: number;
    result: "won" | "lost";
    payout: number;
};

export default function DiceGame() {
    const [bet, setBet] = useState(100);
    const [result, setResult] = useState<number | null>(null);
    const [status, setStatus] = useState<"idle" | "rolling" | "won" | "lost">("idle");
    const [history, setHistory] = useState<DiceHistoryItem[]>([]);

    const rollDice = async () => {
        setStatus("rolling");

        try {
            const res = await fetch(`${API_BASE_URL}/api/games/dice/play`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: "1",
                    bet_amount: bet,
                }),
            });

            const data = await res.json();

            setTimeout(() => {
                setResult(data.dice_value);
                setStatus(data.result);

                setHistory((prev) => [
                    {
                        dice: data.dice_value,
                        result: data.result,
                        payout: data.payout,
                    },
                    ...prev.slice(0, 4),
                ]);
            }, 700);
        } catch (error) {
            console.error(error);
            setStatus("idle");
        }
    };

    return (
        <div className="w-full rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-green-400/70">
                        Fast Game
                    </p>
                    <h2 className="text-3xl font-black text-white">Higher Lower</h2>
                </div>

                <div className="rounded-2xl bg-black/40 px-4 py-2 text-right">
                    <p className="text-xs text-white/40">Multiplier</p>
                    <p className="text-xl font-bold text-green-400">x2.00</p>
                </div>
            </div>

            <div className="mb-4 rounded-[24px] bg-black/40 p-6 text-center">
                <motion.div
                    key={status + String(result)}
                    animate={
                        status === "rolling"
                            ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.15, 1] }
                            : { rotate: 0, scale: 1 }
                    }
                    transition={{ duration: 0.7 }}
                    className={`mx-auto flex h-32 w-32 items-center justify-center rounded-[28px] border text-6xl shadow-2xl ${
                        status === "won"
                            ? "border-green-400/70 bg-green-400/20 shadow-green-400/20"
                            : status === "lost"
                                ? "border-red-400/70 bg-red-400/20 shadow-red-400/20"
                                : "border-white/10 bg-white/[0.06]"
                    }`}
                >
                    {status === "rolling" ? "🎲" : result ?? "🎲"}
                </motion.div>

                <p className="mt-4 text-sm text-white/50">
                    Predict higher outcomes: 4, 5 or 6 wins x2
                </p>
            </div>

            <label className="mb-4 block rounded-2xl bg-black/40 p-3 text-sm text-white/60">
                Bet Amount
                <input
                    value={bet}
                    onChange={(e) => setBet(Number(e.target.value))}
                    type="number"
                    className="mt-2 w-full rounded-xl bg-white/10 px-3 py-2 text-white outline-none"
                />
            </label>

            <button
                onClick={rollDice}
                disabled={status === "rolling"}
                className="w-full rounded-2xl bg-green-400 py-3 font-black text-black disabled:opacity-50"
            >
                {status === "rolling" ? "Rolling..." : "Play Higher Lower"}
            </button>

            {status === "won" && (
                <p className="mt-4 text-center text-sm font-bold text-green-400">
                    You won {bet * 2}
                </p>
            )}

            {status === "lost" && (
                <p className="mt-4 text-center text-sm font-bold text-red-400">
                    You lost {bet}
                </p>
            )}

            {history.length > 0 && (
                <div className="mt-4 rounded-2xl bg-black/30 p-3">
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                        Recent Rounds
                    </p>

                    <div className="space-y-2">
                        {history.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-sm"
                            >
                                <span className="text-white">🎲 {item.dice}</span>
                                <span
                                    className={
                                        item.result === "won" ? "text-green-400" : "text-red-400"
                                    }
                                >
                  {item.result.toUpperCase()}
                </span>
                                <span className="text-white/60">{item.payout}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}