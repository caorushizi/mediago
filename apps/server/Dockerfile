FROM node:20-bookworm-slim AS base

RUN apt-get update && apt-get install -y \
    libicu-dev \
    ffmpeg \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY .mediago-server .

RUN npm init -y
RUN npm install pm2 -g
RUN npm i better-sqlite3

EXPOSE 8899

CMD ["pm2-runtime", "backend/index.cjs"]
