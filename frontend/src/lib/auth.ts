export interface AuthUser {
  userId: string;
  token: string;
  username: string;
  email: string;
  onboardingDone: boolean;
}

export interface WalletDTO {
  user_id: string;
  balance_cents: number;
  updated_at: number;
}

export interface WalletTransactionDTO {
  id: string;
  type: "deposit" | "withdrawal" | "bet" | "win" | "bonus";
  amount_cents: number;
  description: string;
  created_at: number;
}

const KEY = "axbet_user";

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function saveUser(user: AuthUser) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function updateUser(patch: Partial<AuthUser>) {
  const u = getUser();
  if (!u) return;
  saveUser({ ...u, ...patch });
}

export function clearUser() {
  localStorage.removeItem(KEY);
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const user = getUser();
  const headers = new Headers(init?.headers ?? {});
  if (user?.token) {
    headers.set("Authorization", `Bearer ${user.token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
