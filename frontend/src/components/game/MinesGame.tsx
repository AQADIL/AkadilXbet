"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type Cell = {
    id: number;
    isMine: boolean;
    opened: boolean;
};

type MinesHistoryItem = {
    result: "won" | "lost";
    safe: number;
    payout: number;
};

export default function MinesGame() {
    const [bet, setBet] = useState(100);
    const [mineCount, setMineCount] = useState(3);
    const [gameId, setGameId] = useState<string | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [cells, setCells] = useState<Cell[]>([]);
    const [status, setStatus] = useState<"idle" | "playing" | "won" | "lost">("idle");
    const [openedSafe, setOpenedSafe] = useState(0);
    const [history, setHistory] = useState<MinesHistoryItem[]>([]);

    const multiplier = useMemo(() => {
        return 1 + openedSafe * (mineCount * 0.15);
    }, [openedSafe, mineCount]);

    const startGame = async () => {
        const res = await fetch(`${API_BASE_URL}/api/games/mines/start`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: "1",
                bet_amount: bet,
                mines: mineCount,
            }),
        });

        const data = await res.json();

        const newCells: Cell[] = Array.from({ length: 25 }, (_, id) => ({
            id,
            isMine: false,
            opened: false,
        }));

        setGameId(data.game_id);
        setCells(newCells);
        setOpenedSafe(0);
        setStatus("playing");
        setGameStarted(true);
    };

    const openCell = async (id: number) => {
        if (status !== "playing" || !gameId) return;

        const cell = cells.find((c) => c.id === id);
        if (!cell || cell.opened) return;

        const res = await fetch(`${API_BASE_URL}/api/games/mines/open`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                game_id: gameId,
                cell: id,
            }),
        });

        const data = await res.json();

        if (data.status === "lost") {
            setCells((prev) =>
                prev.map((c) =>
                    c.id === id ? { ...c, opened: true, isMine: true } : c
                )
            );

            setHistory((prev) => [
                {
                    result: "lost",
                    safe: openedSafe,
                    payout: 0,
                },
                ...prev.slice(0, 4),
            ]);

            setStatus("lost");
            return;
        }

        setCells((prev) =>
            prev.map((c) => (c.id === id ? { ...c, opened: true } : c))
        );

        setOpenedSafe((prev) => prev + 1);
    };

    const cashout = async () => {
        if (status !== "playing" || openedSafe === 0 || !gameId) return;

        const res = await fetch(`${API_BASE_URL}/api/games/mines/cashout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                game_id: gameId,
            }),
        });

        const data = await res.json();

        setHistory((prev) => [
            {
                result: "won",
                safe: openedSafe,
                payout: data.payout,
            },
            ...prev.slice(0, 4),
        ]);

        setStatus(data.status);
    };

    const previewCells = Array.from({ length: 25 }, (_, id) => ({
        id,
        isMine: false,
        opened: false,
    }));

    return (
        <div className="w-full rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-green-400/70">
                        Fast Game
                    </p>
                    <h2 className="text-3xl font-black text-white">Mines</h2>
                </div>

                <div className="rounded-2xl bg-black/40 px-4 py-2 text-right">
                    <p className="text-xs text-white/40">Multiplier</p>
                    <p className="text-xl font-bold text-green-400">
                        x{multiplier.toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-black/40 p-3 text-center">
                    <p className="text-xs text-white/40">Bet</p>
                    <p className="font-black text-white">{bet}</p>
                </div>

                <div className="rounded-2xl bg-black/40 p-3 text-center">
                    <p className="text-xs text-white/40">Mines</p>
                    <p className="font-black text-red-300">{mineCount}</p>
                </div>

                <div className="rounded-2xl bg-black/40 p-3 text-center">
                    <p className="text-xs text-white/40">Safe</p>
                    <p className="font-black text-green-300">{openedSafe}</p>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
                <label className="rounded-2xl bg-black/40 p-3 text-sm text-white/60">
                    Bet Amount
                    <input
                        value={bet}
                        onChange={(e) => setBet(Number(e.target.value))}
                        type="number"
                        disabled={status === "playing"}
                        className="mt-2 w-full rounded-xl bg-white/10 px-3 py-2 text-white outline-none disabled:opacity-50"
                    />
                </label>

                <label className="rounded-2xl bg-black/40 p-3 text-sm text-white/60">
                    Mines
                    <select
                        value={mineCount}
                        onChange={(e) => setMineCount(Number(e.target.value))}
                        disabled={status === "playing"}
                        className="mt-2 w-full rounded-xl bg-white/10 px-3 py-2 text-white outline-none disabled:opacity-50"
                    >
                        <option value={3}>3 mines</option>
                        <option value={5}>5 mines</option>
                        <option value={8}>8 mines</option>
                    </select>
                </label>
            </div>

            <div className="grid grid-cols-5 gap-2">
                {(gameStarted ? cells : previewCells).map((cell) => (
                    <motion.button
                        key={cell.id}
                        whileHover={{ scale: status === "playing" && !cell.opened ? 1.05 : 1 }}
                        whileTap={{ scale: 0.92 }}
                        animate={cell.opened ? { rotateY: 180 } : { rotateY: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={() => openCell(cell.id)}
                        className={`aspect-square rounded-2xl border text-xl font-black transition shadow-lg ${
                            cell.opened && cell.isMine
                                ? "border-red-500/70 bg-red-500/25 text-red-200 shadow-red-500/20"
                                : cell.opened
                                    ? "border-green-400/70 bg-green-400/20 text-green-300 shadow-green-400/20"
                                    : status === "playing"
                                        ? "border-white/10 bg-white/[0.07] text-white/30 hover:border-green-400/40 hover:bg-green-400/10 hover:shadow-green-400/20"
                                        : "border-white/10 bg-white/[0.04] text-white/20"
                        }`}
                    >
            <span
                className="block"
                style={{ transform: cell.opened ? "rotateY(180deg)" : "none" }}
            >
              {cell.opened ? (cell.isMine ? "💣" : "💎") : ""}
            </span>
                    </motion.button>
                ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                    onClick={startGame}
                    className="rounded-2xl bg-green-400 py-3 font-black text-black shadow-lg shadow-green-400/20"
                >
                    {status === "playing" ? "Restart" : "Start Game"}
                </button>

                <button
                    onClick={cashout}
                    disabled={status !== "playing" || openedSafe === 0}
                    className="rounded-2xl border border-green-400/40 bg-green-400/10 py-3 font-black text-green-300 disabled:opacity-40"
                >
                    Cashout {openedSafe > 0 ? Math.floor(bet * multiplier) : ""}
                </button>
            </div>

            {status === "idle" && (
                <p className="mt-4 text-center text-sm text-white/40">
                    Choose bet and mines, then start the game.
                </p>
            )}

            {status === "playing" && (
                <p className="mt-4 text-center text-sm text-white/40">
                    Open safe cells or cashout before hitting a mine.
                </p>
            )}

            {status === "lost" && (
                <p className="mt-4 text-center text-sm font-bold text-red-400">
                    Boom! You hit a mine and lost {bet}.
                </p>
            )}

            {status === "won" && (
                <p className="mt-4 text-center text-sm font-bold text-green-400">
                    Cashout successful: {Math.floor(bet * multiplier)}
                </p>
            )}

            {history.length > 0 && (
                <div className="mt-4 rounded-2xl bg-black/30 p-3">
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                        Recent Mines
                    </p>

                    <div className="space-y-2">
                        {history.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-sm"
                            >
                                <span className="text-white">💎 {item.safe} safe</span>
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