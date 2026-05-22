FROM golang:1.23-alpine AS builder
WORKDIR /src
COPY pkg/bankrtp ./pkg/bankrtp
COPY services/aviator-service ./services/aviator-service
WORKDIR /src/services/aviator-service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /aviator-service .

FROM alpine:3.20
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /aviator-service .
ENTRYPOINT ["/app/aviator-service"]
