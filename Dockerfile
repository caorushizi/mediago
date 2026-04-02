# Build context: mediago-proj/ (parent directory)
#   docker build -f mediago/Dockerfile -t mediago .

# ===== Stage 1: Build Go Core =====
FROM golang:1.23-bookworm AS go-builder
WORKDIR /src
COPY mediago-core/go.mod mediago-core/go.sum ./
RUN go mod download
COPY mediago-core/ .
RUN CGO_ENABLED=1 go build -o mediago-core ./cmd/server

# ===== Stage 2: Build UI =====
FROM node:22-bookworm-slim AS ui-builder
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
WORKDIR /src
COPY mediago/ .
ENV APP_TARGET=server
ENV NODE_ENV=production
RUN pnpm install --frozen-lockfile
RUN pnpm build:web

# ===== Stage 3: Runtime =====
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=go-builder /src/mediago-core /usr/local/bin/mediago-core
COPY --from=go-builder /src/configs /app/configs
COPY --from=ui-builder /src/apps/ui/build/server /app/static

RUN mkdir -p /app/data /app/logs

EXPOSE 8899

CMD ["mediago-core", \
  "--port=8899", \
  "--static-dir=/app/static", \
  "--enable-auth", \
  "--db-path=/app/data/mediago.db", \
  "--config-dir=/app/data", \
  "--log-dir=/app/logs", \
  "--schema-path=/app/configs/config.json"]
