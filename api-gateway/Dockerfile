FROM golang:1.25.5-alpine AS builder
WORKDIR /src
COPY akadilxbet-protos ./akadilxbet-protos
COPY api-gateway ./api-gateway
WORKDIR /src/api-gateway
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /api-gateway .

FROM alpine:3.20
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /api-gateway .
ENTRYPOINT ["/app/api-gateway"]
