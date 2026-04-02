# Build context: repository root
#   docker build -t mediago .

# ===== Stage 1: Node Builder (runs natively on build machine) =====
FROM --platform=$BUILDPLATFORM node:22-bookworm-slim AS node-builder

RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

# Map Docker TARGETARCH to Node arch naming for deps download
ARG TARGETARCH
RUN if [ "$TARGETARCH" = "amd64" ]; then \
      echo "linux-x64" > /tmp/deps-platform; \
    else \
      echo "linux-${TARGETARCH}" > /tmp/deps-platform; \
    fi

WORKDIR /src

# Install dependencies (cache pnpm store)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc* ./
COPY apps/ui/package.json apps/ui/package.json
COPY apps/player-ui/package.json apps/player-ui/package.json
COPY apps/server/package.json apps/server/package.json
COPY packages/ packages/
RUN pnpm install --frozen-lockfile

# Copy source files
COPY apps/ui/ apps/ui/
COPY apps/player-ui/ apps/player-ui/
COPY scripts/ scripts/
COPY .env* turbo.json ./

# Build player-ui (will be embedded in Go core binary)
RUN pnpm --filter @mediago/player-ui run build

# Build web UI for server mode
ENV APP_TARGET=server
ENV NODE_ENV=production
RUN pnpm build:web

# Download third-party tools for TARGET platform
RUN pnpm deps:download --platform $(cat /tmp/deps-platform)

# ===== Stage 2: Go Builder =====
FROM --platform=$BUILDPLATFORM golang:1.25-bookworm AS go-builder

ARG TARGETOS=linux
ARG TARGETARCH=amd64

WORKDIR /src

# Cache Go module downloads
COPY apps/core/go.mod apps/core/go.sum apps/core/
RUN cd apps/core && go mod download

# Copy Go source
COPY apps/core/ apps/core/

# Copy player-ui dist into assets for go:embed
COPY --from=node-builder /src/apps/player-ui/dist apps/core/assets/player/

# Build Go core binary (cross-compile, no CGO)
RUN cd apps/core && \
    CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -trimpath -ldflags="-s -w" -o /out/mediago-core ./cmd/server

# ===== Stage 3: Runtime =====
FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Core binary
COPY --from=go-builder /out/mediago-core /usr/local/bin/mediago-core

# Web UI static files
COPY --from=node-builder /src/apps/ui/build/server /app/static

# Third-party tools — copy from the platform-specific directory
ARG TARGETARCH
COPY --from=node-builder /src/.deps/linux-* /app/deps-tmp/
RUN mkdir -p /app/deps && \
    if [ -d /app/deps-tmp ]; then \
      find /app/deps-tmp -type f -exec cp {} /app/deps/ \; ; \
    fi && \
    chmod +x /app/deps/* 2>/dev/null || true && \
    rm -rf /app/deps-tmp

RUN mkdir -p /app/data /app/logs /app/downloads

EXPOSE 8899

VOLUME ["/app/data", "/app/downloads"]

CMD ["mediago-core", \
     "--port=8899", \
     "--static-dir=/app/static", \
     "--enable-auth", \
     "--db-path=/app/data/mediago.db", \
     "--config-dir=/app/data", \
     "--log-dir=/app/logs", \
     "--local-dir=/app/downloads", \
     "--m3u8-bin=/app/deps/N_m3u8DL-RE", \
     "--bilibili-bin=/app/deps/BBDown", \
     "--direct-bin=/app/deps/gopeed", \
     "--ffmpeg-bin=/app/deps/ffmpeg"]
