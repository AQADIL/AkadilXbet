package messaging

import (
	"encoding/json"

	"github.com/nats-io/nats.go"
)

const (
	SubjectRoundStarted = "aviator.round.started"
	SubjectRoundCrashed = "aviator.round.crashed"
	SubjectBetSettled   = "aviator.bet.settled"
)

type Publisher struct {
	nc *nats.Conn
}

func NewPublisher(nc *nats.Conn) *Publisher {
	return &Publisher{nc: nc}
}

func (p *Publisher) Publish(subject string, payload any) error {
	b, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	return p.nc.Publish(subject, b)
}
