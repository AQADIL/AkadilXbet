# AkadilXbet

A highly interactive betting platform built on a Go microservices architecture with a Next.js PWA frontend.

## Monorepo Structure

```
AkadilXbet/
├── frontend/          # Next.js PWA (App Router, TypeScript, Tailwind CSS)
├── api-gateway/       # Go API Gateway (HTTP → gRPC reverse proxy)
├── services/          # Go microservices
│   ├── auth-service/
│   ├── betting-service/
│   ├── wallet-service/
│   ├── odds-service/
│   ├── notification-service/
│   ├── casino-service/
│   ├── kyc-service/
│   └── reporting-service/
├── deploy/            # Docker Compose, Kubernetes manifests, Helm charts
│   └── docker-compose.yml
├── proto/             # Shared protobuf definitions
├── .env.example
├── .gitignore
└── Makefile
```

## Infrastructure Services

| Service    | Local Port | Purpose                         |
|------------|------------|---------------------------------|
| PostgreSQL  | 5432       | Primary relational database     |
| Redis       | 6379       | Caching, sessions, rate limiting|
| NATS        | 4222       | Async message broker (JetStream)|
| NATS Monitor| 8222       | NATS monitoring UI              |
| Mailpit SMTP| 1025       | Local email testing (SMTP)      |
| Mailpit UI  | 8025       | Email inbox UI                  |

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Go 1.22+
- Node.js 20+
- `protoc` + `protoc-gen-go` + `protoc-gen-go-grpc`

### Setup

```bash
cp .env.example .env
make infra-up
```

### Common Commands

```bash
make infra-up       # Start all infrastructure containers
make infra-down     # Stop all infrastructure containers
make proto-gen      # Generate Go code from .proto files
make test           # Run all service tests
```
