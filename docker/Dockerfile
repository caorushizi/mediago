FROM node:20-bookworm-slim AS base

RUN apt-get update && apt-get install -y \
    libicu-dev \
    ffmpeg \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/webapi/package.json ./apps/webapi/
COPY packages/shared/package.json ./packages/shared/

# Install pnpm and dependencies
RUN npm install -g pnpm@10.15.0
RUN pnpm install --frozen-lockfile --prod

# Copy source code
COPY apps/webapi ./apps/webapi
COPY packages/shared ./packages/shared

# Build the application
WORKDIR /app/apps/webapi
RUN pnpm build

EXPOSE 8899

CMD ["node", "dist/index.js"]
