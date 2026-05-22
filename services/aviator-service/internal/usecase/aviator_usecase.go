package usecase

import (
	"context"
	"math"
	"strconv"
	"sync"
	"time"

	"github.com/akadilxbet/aviator-service/internal/client"
	"github.com/akadilxbet/aviator-service/internal/config"
	"github.com/akadilxbet/aviator-service/internal/domain"
	"github.com/akadilxbet/aviator-service/internal/messaging"
	"github.com/akadilxbet/aviator-service/internal/repository"
	"github.com/akadilxbet/pkg/bankrtp"
	"github.com/google/uuid"
)

type AviatorUseCase struct {
	rounds    repository.RoundRepository
	bets      repository.BetRepository
	cache     repository.RoundCache
	wallet    *client.WalletClient
	publisher *messaging.Publisher
	cfg       *config.Config

	mu          sync.RWMutex
	current     *domain.Round
	subscribers []chan *domain.Round
}

func NewAviatorUseCase(
	rounds repository.RoundRepository,
	bets repository.BetRepository,
	cache repository.RoundCache,
	wallet *client.WalletClient,
	publisher *messaging.Publisher,
	cfg *config.Config,
) *AviatorUseCase {
	return &AviatorUseCase{
		rounds:    rounds,
		bets:      bets,
		cache:     cache,
		wallet:    wallet,
		publisher: publisher,
		cfg:       cfg,
	}
}

func (uc *AviatorUseCase) StartEngine(ctx context.Context) {
	go uc.loop(ctx)
}

func (uc *AviatorUseCase) loop(ctx context.Context) {
	for {
		uc.runRound(ctx)
		time.Sleep(2 * time.Second)
	}
}

func (uc *AviatorUseCase) runRound(ctx context.Context) {
	cp := bankrtp.GetCrashPoint(0)
	round := &domain.Round{
		ID:                uuid.NewString(),
		Status:            domain.RoundWaiting,
		CurrentMultiplier: 1.0,
		CrashMultiplier:   cp.Multiplier,
		StartedAt:         time.Now(),
	}
	_ = uc.rounds.Create(ctx, round)
	uc.setCurrent(round)

	_ = uc.publisher.Publish(messaging.SubjectRoundStarted, map[string]any{
		"round_id": round.ID, "crash": round.CrashMultiplier,
	})

	time.Sleep(time.Duration(uc.cfg.BettingSeconds) * time.Second)

	uc.mu.Lock()
	round.Status = domain.RoundFlying
	flyStart := time.Now()
	uc.mu.Unlock()
	uc.persistRound(ctx, round)

	ticker := time.NewTicker(time.Duration(uc.cfg.TickIntervalMs) * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			elapsed := time.Since(flyStart).Seconds()
			mult := math.Pow(math.E, 0.06*elapsed)
			if mult < 1.0 {
				mult = 1.0
			}
			mult = math.Round(mult*100) / 100

			uc.mu.Lock()
			round.CurrentMultiplier = mult
			if mult >= round.CrashMultiplier {
				round.Status = domain.RoundCrashed
				now := time.Now()
				round.CrashedAt = &now
				uc.mu.Unlock()
				uc.finishRound(ctx, round)
				return
			}
			uc.mu.Unlock()
			uc.persistRound(ctx, round)
			uc.processAutoCashouts(ctx, round, mult)
			uc.broadcast(round)
		}
	}
}

func (uc *AviatorUseCase) finishRound(ctx context.Context, round *domain.Round) {
	active, _ := uc.bets.ListActiveByRound(ctx, round.ID)
	for _, b := range active {
		b.Status = domain.BetLost
		_ = uc.bets.Update(ctx, b)
		bankrtp.RecordDelta(b.AmountCents)
	}
	_ = uc.publisher.Publish(messaging.SubjectRoundCrashed, map[string]any{
		"round_id": round.ID, "crash": round.CrashMultiplier,
	})
	uc.persistRound(ctx, round)
	uc.broadcast(round)
}

func (uc *AviatorUseCase) processAutoCashouts(ctx context.Context, round *domain.Round, mult float64) {
	active, _ := uc.bets.ListActiveByRound(ctx, round.ID)
	for _, b := range active {
		if b.AutoCashoutMult > 0 && mult >= b.AutoCashoutMult {
			_, _, _ = uc.CashOut(ctx, b.UserID, b.ID, mult)
		}
	}
}

func (uc *AviatorUseCase) GetCurrentRound(ctx context.Context) (*domain.Round, error) {
	uc.mu.RLock()
	defer uc.mu.RUnlock()
	if uc.current != nil {
		return uc.current, nil
	}
	return uc.cache.GetCurrent(ctx)
}

func (uc *AviatorUseCase) PlaceBet(ctx context.Context, userID string, amountCents int64) (*domain.Bet, int64, error) {
	round, err := uc.GetCurrentRound(ctx)
	if err != nil {
		return nil, 0, err
	}
	if round.Status != domain.RoundWaiting {
		return nil, 0, domain.ErrBetClosed
	}
	bal, err := uc.wallet.Deduct(ctx, userID, amountCents, "Aviator bet")
	if err != nil {
		return nil, 0, domain.ErrInsufficientFunds
	}
	bet := &domain.Bet{
		ID:          uuid.NewString(),
		RoundID:     round.ID,
		UserID:      userID,
		AmountCents: amountCents,
		Status:      domain.BetActive,
	}
	if err := uc.bets.Create(ctx, bet); err != nil {
		_, _ = uc.wallet.Deposit(ctx, userID, amountCents, "Aviator bet refund")
		return nil, 0, err
	}
	round.TotalBetCents += amountCents
	uc.mu.Lock()
	uc.current = round
	uc.mu.Unlock()
	_ = uc.rounds.Update(ctx, round)
	return bet, bal, nil
}

func (uc *AviatorUseCase) CashOut(ctx context.Context, userID, betID string, atMult float64) (*domain.Bet, int64, error) {
	bet, err := uc.bets.GetByID(ctx, betID)
	if err != nil {
		return nil, 0, err
	}
	if bet.UserID != userID {
		return nil, 0, domain.ErrUnauthorizedBet
	}
	if bet.Status != domain.BetActive {
		return nil, 0, domain.ErrBetClosed
	}
	round, err := uc.GetCurrentRound(ctx)
	if err != nil {
		return nil, 0, err
	}
	if round.Status != domain.RoundFlying {
		return nil, 0, domain.ErrInvalidPhase
	}
	if atMult <= 0 {
		atMult = round.CurrentMultiplier
	}
	payout := int64(float64(bet.AmountCents) * atMult)
	bet.Status = domain.BetCashed
	bet.CashoutMultiplier = atMult
	bet.PayoutCents = payout
	_ = uc.bets.Update(ctx, bet)
	bal, err := uc.wallet.Deposit(ctx, userID, payout, "Aviator cashout")
	if err != nil {
		return nil, 0, err
	}

	// Send push notification for win
	_ = uc.publisher.Publish("notification.send", []byte(`{"user_id":"`+userID+`","title":"Aviator win!","body":"You cashed out at `+strconv.FormatFloat(atMult, 'f', 2, 64)+`x","tag":"win"}`))
	bankrtp.RecordDelta(-(payout - bet.AmountCents))
	_ = uc.publisher.Publish(messaging.SubjectBetSettled, map[string]any{
		"bet_id": bet.ID, "payout": payout,
	})
	return bet, bal, nil
}

func (uc *AviatorUseCase) SetAutoCashOut(ctx context.Context, userID, betID string, mult float64) error {
	bet, err := uc.bets.GetByID(ctx, betID)
	if err != nil {
		return err
	}
	if bet.UserID != userID {
		return domain.ErrUnauthorizedBet
	}
	bet.AutoCashoutMult = mult
	return uc.bets.Update(ctx, bet)
}

func (uc *AviatorUseCase) ClearAutoCashOut(ctx context.Context, userID, betID string) error {
	bet, err := uc.bets.GetByID(ctx, betID)
	if err != nil {
		return err
	}
	if bet.UserID != userID {
		return domain.ErrUnauthorizedBet
	}
	bet.AutoCashoutMult = 0
	return uc.bets.Update(ctx, bet)
}

func (uc *AviatorUseCase) GetMyActiveBets(ctx context.Context, userID string) ([]*domain.Bet, error) {
	round, err := uc.GetCurrentRound(ctx)
	if err != nil {
		return nil, err
	}
	return uc.bets.ListActiveByUserRound(ctx, userID, round.ID)
}

func (uc *AviatorUseCase) GetRoundHistory(ctx context.Context, limit int) ([]*domain.Round, error) {
	return uc.rounds.ListHistory(ctx, limit)
}

func (uc *AviatorUseCase) GetRoundByID(ctx context.Context, id string) (*domain.Round, error) {
	return uc.rounds.GetByID(ctx, id)
}

func (uc *AviatorUseCase) GetBetsByRound(ctx context.Context, roundID string) ([]*domain.Bet, error) {
	return uc.bets.ListByRound(ctx, roundID)
}

func (uc *AviatorUseCase) GetPlayerStats(ctx context.Context, userID string) (int32, int32, int64, int64, error) {
	return uc.bets.PlayerStats(ctx, userID)
}

func (uc *AviatorUseCase) Subscribe() <-chan *domain.Round {
	ch := make(chan *domain.Round, 8)
	uc.mu.Lock()
	uc.subscribers = append(uc.subscribers, ch)
	uc.mu.Unlock()
	return ch
}

func (uc *AviatorUseCase) setCurrent(r *domain.Round) {
	uc.mu.Lock()
	uc.current = r
	uc.mu.Unlock()
	_ = uc.cache.SetCurrent(context.Background(), r)
}

func (uc *AviatorUseCase) persistRound(ctx context.Context, r *domain.Round) {
	_ = uc.rounds.Update(ctx, r)
	_ = uc.cache.SetCurrent(ctx, r)
}

func (uc *AviatorUseCase) broadcast(r *domain.Round) {
	uc.mu.RLock()
	subs := append([]chan *domain.Round(nil), uc.subscribers...)
	uc.mu.RUnlock()
	snap := *r
	for _, ch := range subs {
		select {
		case ch <- &snap:
		default:
		}
	}
}
