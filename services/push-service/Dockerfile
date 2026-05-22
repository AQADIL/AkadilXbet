FROM golang:1.25-alpine AS builder
WORKDIR /src
COPY . .
RUN go mod tidy
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /push-service .

FROM alpine:3.20
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /push-service .
EXPOSE 8086
ENTRYPOINT ["./push-service"]
