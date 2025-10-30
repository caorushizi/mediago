FROM node:20-bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /tmp
RUN npm install --global pm2

FROM node:20-bookworm-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    libicu-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY .mediago-server ./
COPY --from=builder /usr/local/bin/pm2 /usr/local/bin/pm2
COPY --from=builder /usr/local/bin/pm2-runtime /usr/local/bin/pm2-runtime
COPY --from=builder /usr/local/lib/node_modules /usr/local/lib/node_modules

EXPOSE 8899

CMD ["pm2-runtime", "backend/index.cjs"]
