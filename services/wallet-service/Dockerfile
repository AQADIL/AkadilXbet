FROM golang:1.23-alpine AS builder
WORKDIR /src
COPY akadilxbet-protos ./akadilxbet-protos
COPY services/wallet-service ./services/wallet-service
WORKDIR /src/services/wallet-service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /wallet-service .

FROM alpine:3.20
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /wallet-service .
ENTRYPOINT ["/app/wallet-service"]
