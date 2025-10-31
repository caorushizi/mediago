FROM node:20-bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /tmp

FROM node:20-bookworm-slim AS runner

WORKDIR /app
RUN npm install --global pm2
RUN npm i @mediago/player @mediago/core @mediago/deps typeorm better-sqlite3

COPY .mediago-server ./

EXPOSE 8899

CMD ["pm2-runtime", "backend/index.cjs"]
