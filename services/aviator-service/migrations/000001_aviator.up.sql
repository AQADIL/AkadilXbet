CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS aviator_rounds (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status            TEXT NOT NULL,
    current_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    crash_multiplier   DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    total_bet_cents    BIGINT NOT NULL DEFAULT 0,
    started_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    crashed_at         TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS aviator_bets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id            UUID NOT NULL REFERENCES aviator_rounds(id),
    user_id             UUID NOT NULL,
    amount_cents        BIGINT NOT NULL CHECK (amount_cents > 0),
    status              TEXT NOT NULL,
    auto_cashout_mult   DOUBLE PRECISION NOT NULL DEFAULT 0,
    cashout_multiplier  DOUBLE PRECISION NOT NULL DEFAULT 0,
    payout_cents        BIGINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aviator_bets_round ON aviator_bets(round_id);
CREATE INDEX IF NOT EXISTS idx_aviator_bets_user ON aviator_bets(user_id);
