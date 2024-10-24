FROM m.daocloud.io/docker.io/library/node:20-bookworm-slim AS builder

WORKDIR /build

COPY . .

RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list.d/* && \
    apt-get update && apt-get install -y \
    git \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/* && \
    npm install -g pnpm --registry=https://registry.npmmirror.com && \
    pnpm config set registry https://registry.npmmirror.com && \
    pnpm install && \
    cd packages/backend && pnpm run build

WORKDIR /app

RUN mv /build/packages/backend/dist/* /app/. && \
    mv /build/packages/main/app/build/renderer /app/app && \
    mv /build/packages/backend/package*.json . && \
    pnpm install --prod && \
    pnpm rebuild

FROM m.daocloud.io/docker.io/library/node:20-bookworm-slim

WORKDIR /app

COPY --from=builder /app /app

# create data dir and set permission of app and data dir for non-privileged user
RUN mkdir /data && \
    chmod -R 777 /app && \
    chmod -R 777 /data

# switch data dir
# TODO: use DATA_DIR env instead of hardcoded HOME
ENV HOME=/data

# COPY --from=deb_extractor /dpkg /
RUN apt-get update && \
    apt-get install -y libicu-dev ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN npm install pm2 -g

EXPOSE 8899

CMD ["pm2-runtime", "server/index.js"]
