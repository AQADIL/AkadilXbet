CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS balloon_sessions (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL,
    status             TEXT NOT NULL,
    bet_amount_cents   BIGINT NOT NULL DEFAULT 0,
    current_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    pump_count         INT NOT NULL DEFAULT 0,
    payout_cents       BIGINT NOT NULL DEFAULT 0,
    started_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_balloon_sessions_user ON balloon_sessions(user_id);
