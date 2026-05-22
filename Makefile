.PHONY: up down logs infra-up infra-down infra-logs migrate-auth migrate-wallet migrate-aviator migrate-balloon migrate-all \
        build-gateway build-auth build-wallet build-aviator build-balloon build-all test lint tidy

COMPOSE_FILE=deploy/docker-compose.yml
PROTO_DIR=proto
PROTO_OUT_DIR=proto/gen

include .env
export

DB_URL=postgres://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@$(POSTGRES_HOST):$(POSTGRES_PORT)/$(POSTGRES_DB)?sslmode=disable

up:
	docker compose -f $(COMPOSE_FILE) --env-file .env up -d --build

down:
	docker compose -f $(COMPOSE_FILE) --env-file .env down

logs:
	docker compose -f $(COMPOSE_FILE) logs -f

infra-up:
	docker compose -f $(COMPOSE_FILE) --env-file .env up -d postgres redis nats mailpit

infra-down:
	docker compose -f $(COMPOSE_FILE) --env-file .env down

infra-logs:
	docker compose -f $(COMPOSE_FILE) logs -f postgres redis nats

migrate-auth:
	migrate -path services/auth-service/migrations -database "$(DB_URL)" up

migrate-wallet:
	migrate -path services/wallet-service/migrations -database "$(DB_URL)" up

migrate-aviator:
	migrate -path services/aviator-service/migrations -database "$(DB_URL)" up

migrate-balloon:
	migrate -path services/balloon-service/migrations -database "$(DB_URL)" up

migrate-all: migrate-auth migrate-wallet migrate-aviator migrate-balloon

proto-gen:
	find $(PROTO_DIR) -name "*.proto" -exec protoc \
		--go_out=$(PROTO_OUT_DIR) \
		--go_opt=paths=source_relative \
		--go-grpc_out=$(PROTO_OUT_DIR) \
		--go-grpc_opt=paths=source_relative \
		--proto_path=$(PROTO_DIR) {} \;

build-gateway:
	cd api-gateway && go build -o ../bin/api-gateway ./...

build-auth:
	cd services/auth-service && go build -o ../../bin/auth-service ./...

build-wallet:
	cd services/wallet-service && go build -o ../../bin/wallet-service ./...

build-aviator:
	cd services/aviator-service && go build -o ../../bin/aviator-service ./...

build-balloon:
	cd services/balloon-service && go build -o ../../bin/balloon-service ./...

build-all: build-gateway build-auth build-wallet build-aviator build-balloon

test:
	cd api-gateway && go test ./... -v -race -count=1
	cd services/auth-service && go test ./... -v -race -count=1
	cd services/wallet-service && go test ./... -v -race -count=1
	cd pkg/bankrtp && go test ./... -v -count=1
	cd services/aviator-service && go test ./... -v -count=1
	cd services/balloon-service && go test ./... -v -count=1

lint:
	cd api-gateway && go vet ./...
	cd services/auth-service && go vet ./...
	cd services/wallet-service && go vet ./...

tidy:
	cd api-gateway && go mod tidy
	cd services/auth-service && go mod tidy
	cd services/wallet-service && go mod tidy
