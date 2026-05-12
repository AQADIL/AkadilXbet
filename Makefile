.PHONY: infra-up infra-down infra-logs proto-gen test build-gateway build-auth lint

COMPOSE_FILE=deploy/docker-compose.yml
PROTO_DIR=proto
PROTO_OUT_DIR=proto/gen

infra-up:
	docker compose -f $(COMPOSE_FILE) --env-file .env up -d

infra-down:
	docker compose -f $(COMPOSE_FILE) --env-file .env down

infra-logs:
	docker compose -f $(COMPOSE_FILE) logs -f

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

build-all: build-gateway build-auth

test:
	cd api-gateway && go test ./... -v -race -count=1
	cd services/auth-service && go test ./... -v -race -count=1

lint:
	cd api-gateway && go vet ./...
	cd services/auth-service && go vet ./...

tidy:
	cd api-gateway && go mod tidy
	cd services/auth-service && go mod tidy
