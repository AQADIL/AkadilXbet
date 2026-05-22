"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "akadilxbet_balance";
export const INITIAL_BALANCE = 1000;

export function useBalance() {
  const [balance, setBalanceState] = useState(INITIAL_BALANCE);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setBalanceState(parseFloat(stored));
  }, []);

  const setBalance = useCallback((val: number) => {
    const clamped = Math.max(0, Math.round(val * 10) / 10);
    setBalanceState(clamped);
    localStorage.setItem(STORAGE_KEY, String(clamped));
  }, []);

  const placeBet = useCallback(
    (amount: number): boolean => {
      const cur = parseFloat(localStorage.getItem(STORAGE_KEY) ?? String(INITIAL_BALANCE));
      if (amount > cur || amount <= 0) return false;
      const next = cur - amount;
      setBalanceState(next);
      localStorage.setItem(STORAGE_KEY, String(next));
      return true;
    },
    []
  );

  const addWinnings = useCallback((amount: number) => {
    const cur = parseFloat(localStorage.getItem(STORAGE_KEY) ?? "0");
    const next = Math.round((cur + amount) * 10) / 10;
    setBalanceState(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }, []);

  return { balance, placeBet, addWinnings, setBalance };
}
