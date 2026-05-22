package events

import (
	"encoding/json"

	"github.com/nats-io/nats.go"
)

const SubjectUserCreated = "auth.user.created"

type UserCreatedEvent struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
}

type Publisher struct {
	nc *nats.Conn
}

func NewPublisher(nc *nats.Conn) *Publisher {
	return &Publisher{nc: nc}
}

func (p *Publisher) PublishUserCreated(userID, email string) error {
	payload, err := json.Marshal(UserCreatedEvent{UserID: userID, Email: email})
	if err != nil {
		return err
	}
	return p.nc.Publish(SubjectUserCreated, payload)
}

func (p *Publisher) PublishNotification(userID, title, body, tag string) error {
	payload := []byte(`{"user_id":"` + userID + `","title":"` + title + `","body":"` + body + `","tag":"` + tag + `"}`)
	return p.nc.Publish("notification.send", payload)
}
