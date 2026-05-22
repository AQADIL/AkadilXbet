const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const USER_ID = "demo-user";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": USER_ID,
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "request failed");
  }
  return data as T;
}

export type AviatorRound = {
  round_id: string;
  status: string;
  current_multiplier: number;
  crash_multiplier: number;
};

export function getAviatorRound() {
  return api<AviatorRound>("/api/v1/aviator/round");
}

export function getAviatorBalance() {
  return api<{ balance_cents: number }>("/api/v1/aviator/balance");
}

export function placeAviatorBet(amountCents: number) {
  return api<{ bet_id: string; round_id: string; status: string; balance_cents: number }>(
    "/api/v1/aviator/bets",
    { method: "POST", body: JSON.stringify({ amount_cents: amountCents }) }
  );
}

export function cashOutAviator(betId: string) {
  return api<{ multiplier: number; payout_cents: number; balance_cents: number }>(
    "/api/v1/aviator/cashout",
    { method: "POST", body: JSON.stringify({ bet_id: betId }) }
  );
}

export function setAviatorAutoCashout(betId: string, multiplier: number) {
  return api<{ active: boolean; multiplier: number }>(
    "/api/v1/aviator/auto-cashout",
    { method: "POST", body: JSON.stringify({ bet_id: betId, multiplier }) }
  );
}

export function subscribeAviatorRound(onTick: (round: AviatorRound) => void) {
  const url = `${API_BASE}/api/v1/aviator/stream`;
  const es = new EventSource(url);
  es.onmessage = (ev) => {
    try {
      onTick(JSON.parse(ev.data) as AviatorRound);
    } catch {
      /* ignore */
    }
  };
  return () => es.close();
}

export type BalloonSession = {
  session_id: string;
  status: string;
  current_multiplier: number;
  bet_amount_cents: number;
};

export function getBalloonSession() {
  return api<BalloonSession>("/api/v1/balloon/session");
}

export function getBalloonBalance() {
  return api<{ balance_cents: number }>("/api/v1/balloon/balance");
}

export function placeBalloonBet(amountCents: number) {
  return api<{ session: BalloonSession; balance_cents: number }>(
    "/api/v1/balloon/bets",
    { method: "POST", body: JSON.stringify({ amount_cents: amountCents }) }
  );
}

export function pumpBalloon() {
  return api<{ session: BalloonSession; popped: boolean }>("/api/v1/balloon/pump", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function releaseBalloon() {
  return api<{
    session: BalloonSession;
    balance_cents: number;
    payout_cents: number;
    multiplier: number;
  }>("/api/v1/balloon/release", { method: "POST", body: JSON.stringify({}) });
}

export function formatCredits(cents: number) {
  return (cents / 100).toFixed(2);
}
