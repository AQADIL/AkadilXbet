FROM golang:1.23-alpine AS builder
WORKDIR /src
COPY pkg/bankrtp ./pkg/bankrtp
COPY services/balloon-service ./services/balloon-service
WORKDIR /src/services/balloon-service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /balloon-service .

FROM alpine:3.20
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /balloon-service .
ENTRYPOINT ["/app/balloon-service"]
