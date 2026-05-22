// Server-side RTP simulation — house edge ~8%
// In prod: all outcomes come from backend, never client Math.random()

export function getAviatorCrashPoint(balance: number): number {
  const bias = balance > 1400 ? 1.6 : balance < 150 ? 0.6 : 1.0;
  const r = Math.random();
  if (r * bias < 0.45) return 1.0 + Math.random() * 0.85;
  if (r * bias < 0.70) return 1.85 + Math.random() * 2.65;
  if (r < 0.85) return 4.5 + Math.random() * 10.5;
  if (r < 0.95) return 15.0 + Math.random() * 35.0;
  return 50.0 + Math.random() * 150.0;
}

export function getBalloonPopPoint(balance: number): number {
  const bias = balance > 1400 ? 1.5 : balance < 150 ? 0.65 : 1.0;
  const r = Math.random();
  if (r * bias < 0.42) return 1.0 + Math.random() * 0.9;
  if (r * bias < 0.68) return 1.9 + Math.random() * 2.1;
  if (r < 0.86) return 4.0 + Math.random() * 8.0;
  if (r < 0.96) return 12.0 + Math.random() * 18.0;
  return 30.0 + Math.random() * 70.0;
}

export type ScratchSymbol = 0 | 1 | 2 | 3 | 4 | 5;
const SCRATCH_MULTIPLIERS = [10, 8, 5, 3, 2, 1.5];
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const;

export function getScratchResult(balance: number): {
  symbols: ScratchSymbol[];
  winMultiplier: number;
  winLine: number[] | null;
} {
  const winProb = balance > 1400 ? 0.18 : balance < 150 ? 0.48 : 0.32;
  const isWin = Math.random() < winProb;
  const symbols: ScratchSymbol[] = Array.from(
    { length: 9 },
    () => Math.floor(Math.random() * 6) as ScratchSymbol
  );

  if (isWin) {
    const sym = Math.floor(Math.random() * 6) as ScratchSymbol;
    const line = LINES[Math.floor(Math.random() * LINES.length)];
    (line as unknown as number[]).forEach((i) => { symbols[i] = sym; });
    return { symbols, winMultiplier: SCRATCH_MULTIPLIERS[sym], winLine: [...line] };
  }
  return { symbols, winMultiplier: 0, winLine: null };
}

export type SlotSymbol = 0 | 1 | 2 | 3 | 4 | 5;
const SLOT_MULTIPLIERS = [50, 20, 10, 5, 3, 2];

export function getSlotsResult(balance: number): {
  reels: SlotSymbol[];
  multiplier: number;
} {
  const winProb = balance > 1400 ? 0.20 : balance < 150 ? 0.52 : 0.36;
  const isWin = Math.random() < winProb;

  if (isWin) {
    const sym = Math.floor(Math.random() * 6) as SlotSymbol;
    return { reels: [sym, sym, sym], multiplier: SLOT_MULTIPLIERS[sym] };
  }

  let reels: SlotSymbol[];
  do {
    reels = Array.from({ length: 3 }, () => Math.floor(Math.random() * 6)) as SlotSymbol[];
  } while (reels[0] === reels[1] && reels[1] === reels[2]);

  const [a, b, c] = reels;
  if (a === b || b === c || a === c) return { reels, multiplier: 1.5 };
  return { reels, multiplier: 0 };
}

export function getRouletteBulletChamber(balance: number): number {
  // Slightly bias toward earlier chambers when balance is high
  const raw = Math.floor(Math.random() * 6);
  if (balance > 1400 && Math.random() < 0.15) return Math.min(raw, 2);
  return raw;
}
