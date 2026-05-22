FROM golang:1.23-alpine AS builder
WORKDIR /src
COPY akadilxbet-protos ./akadilxbet-protos
COPY services/auth-service ./services/auth-service
WORKDIR /src/services/auth-service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /auth-service .

FROM alpine:3.20
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /auth-service .
ENTRYPOINT ["/app/auth-service"]
