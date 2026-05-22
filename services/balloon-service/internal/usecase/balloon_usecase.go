package usecase

import (
	"context"
	"errors"
	"math"
	"sync"
	"time"

	"github.com/akadilxbet/balloon-service/internal/client"
	"github.com/akadilxbet/balloon-service/internal/config"
	"github.com/akadilxbet/balloon-service/internal/domain"
	"github.com/akadilxbet/balloon-service/internal/messaging"
	"github.com/akadilxbet/balloon-service/internal/repository/postgres"
	"github.com/akadilxbet/pkg/bankrtp"
	"github.com/google/uuid"
)

type BalloonUseCase struct {
	sessions  *postgres.SessionRepo
	balance   *client.BalanceStore
	publisher *messaging.Publisher
	cfg       *config.Config

	mu       sync.RWMutex
	active   map[string]*domain.Session
	lastPump map[string]time.Time
}

func NewBalloonUseCase(
	sessions *postgres.SessionRepo,
	balance *client.BalanceStore,
	publisher *messaging.Publisher,
	cfg *config.Config,
) *BalloonUseCase {
	return &BalloonUseCase{
		sessions:  sessions,
		balance:   balance,
		publisher: publisher,
		cfg:       cfg,
		active:    make(map[string]*domain.Session),
		lastPump:  make(map[string]time.Time),
	}
}

func (uc *BalloonUseCase) GetConfig() *config.Config {
	return uc.cfg
}

func (uc *BalloonUseCase) StartSession(ctx context.Context, userID string) (*domain.Session, error) {
	if s, _ := uc.sessions.GetActiveByUser(ctx, userID); s != nil {
		return s, nil
	}
	s := &domain.Session{
		ID: userID + "-idle", UserID: userID, Status: domain.StatusIdle,
		CurrentMultiplier: 1.0, StartedAt: time.Now(),
	}
	return s, nil
}

func (uc *BalloonUseCase) PlaceBet(ctx context.Context, userID string, amount int64) (*domain.Session, int64, error) {
	if amount < uc.cfg.MinBetCents || amount > uc.cfg.MaxBetCents {
		return nil, 0, errors.New("invalid bet amount")
	}
	if existing, _ := uc.sessions.GetActiveByUser(ctx, userID); existing != nil {
		return nil, 0, errors.New("session already active")
	}
	bal, err := uc.balance.Deduct(ctx, userID, amount)
	if err != nil {
		return nil, 0, err
	}
	s := &domain.Session{
		ID: uuid.NewString(), UserID: userID, Status: domain.StatusActive,
		BetAmountCents: amount, CurrentMultiplier: 1.0, StartedAt: time.Now(),
	}
	if err := uc.sessions.Create(ctx, s); err != nil {
		_, _ = uc.balance.Deposit(ctx, userID, amount)
		return nil, 0, err
	}
	uc.mu.Lock()
	uc.active[userID] = s
	uc.mu.Unlock()
	_ = uc.publisher.Publish(messaging.SubjectSessionStarted, map[string]string{"session_id": s.ID})
	return s, bal, nil
}

func (uc *BalloonUseCase) Pump(ctx context.Context, userID string) (*domain.Session, bool, error) {
	s, err := uc.getActive(ctx, userID)
	if err != nil {
		return nil, false, err
	}
	if last, ok := uc.lastPump[userID]; ok && time.Since(last) < 80*time.Millisecond {
		return s, false, nil
	}
	uc.lastPump[userID] = time.Now()
	s.PumpCount++
	s.CurrentMultiplier = math.Round((s.CurrentMultiplier+0.04+s.CurrentMultiplier*0.02)*100) / 100
	popped := bankrtp.ShouldPop(s.CurrentMultiplier, s.PumpCount)
	if popped {
		s.Status = domain.StatusPopped
		now := time.Now()
		s.EndedAt = &now
		bankrtp.RecordDelta(s.BetAmountCents)
		_ = uc.sessions.Update(ctx, s)
		uc.clearActive(userID)
		_ = uc.publisher.Publish(messaging.SubjectSessionEnded, map[string]any{"session_id": s.ID, "popped": true})
		return s, true, nil
	}
	_ = uc.sessions.Update(ctx, s)
	return s, false, nil
}

func (uc *BalloonUseCase) Release(ctx context.Context, userID string) (*domain.Session, int64, error) {
	s, err := uc.getActive(ctx, userID)
	if err != nil {
		return nil, 0, err
	}
	payout := int64(float64(s.BetAmountCents) * s.CurrentMultiplier)
	s.Status = domain.StatusWon
	s.PayoutCents = payout
	now := time.Now()
	s.EndedAt = &now
	_ = uc.sessions.Update(ctx, s)
	bal, err := uc.balance.Deposit(ctx, userID, payout)
	if err != nil {
		return nil, 0, err
	}
	bankrtp.RecordDelta(-(payout - s.BetAmountCents))
	uc.clearActive(userID)
	_ = uc.publisher.Publish(messaging.SubjectSessionEnded, map[string]any{"session_id": s.ID, "won": true})
	return s, bal, nil
}

func (uc *BalloonUseCase) GetActiveSession(ctx context.Context, userID string) (*domain.Session, error) {
	s, err := uc.sessions.GetActiveByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if s == nil {
		return &domain.Session{UserID: userID, Status: domain.StatusIdle, CurrentMultiplier: 1.0}, nil
	}
	return s, nil
}

func (uc *BalloonUseCase) AbortSession(ctx context.Context, userID string) (*domain.Session, error) {
	s, err := uc.getActive(ctx, userID)
	if err != nil {
		return nil, err
	}
	s.Status = domain.StatusAborted
	now := time.Now()
	s.EndedAt = &now
	_ = uc.sessions.Update(ctx, s)
	_, _ = uc.balance.Deposit(ctx, userID, s.BetAmountCents)
	uc.clearActive(userID)
	return s, nil
}

func (uc *BalloonUseCase) GetSessionResult(ctx context.Context, sessionID string) (*domain.Session, error) {
	return uc.sessions.GetByID(ctx, sessionID)
}

func (uc *BalloonUseCase) GetHistory(ctx context.Context, userID string, limit int) ([]*domain.Session, error) {
	return uc.sessions.ListHistory(ctx, userID, limit)
}

func (uc *BalloonUseCase) ValidatePumpRate(userID string, intervalMs int64) (bool, string) {
	if intervalMs < 80 {
		return false, "too fast"
	}
	return true, ""
}

func (uc *BalloonUseCase) GetPlayerStats(ctx context.Context, userID string) (int32, int32, int64, int64, error) {
	return uc.sessions.PlayerStats(ctx, userID)
}

func (uc *BalloonUseCase) getActive(ctx context.Context, userID string) (*domain.Session, error) {
	uc.mu.RLock()
	if s, ok := uc.active[userID]; ok {
		uc.mu.RUnlock()
		return s, nil
	}
	uc.mu.RUnlock()
	s, err := uc.sessions.GetActiveByUser(ctx, userID)
	if err != nil || s == nil {
		return nil, errors.New("no active session")
	}
	return s, nil
}

func (uc *BalloonUseCase) clearActive(userID string) {
	uc.mu.Lock()
	delete(uc.active, userID)
	uc.mu.Unlock()
}
