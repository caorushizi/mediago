FROM m.daocloud.io/docker.io/library/node:20 AS builder

WORKDIR /app

COPY ./packages/backend/dist /app

COPY ./packages/backend/package*.json ./

RUN npm install --omit=dev --registry=https://registry.npmmirror.com

RUN npm rebuild

# FROM m.daocloud.io/docker.io/library/debian:11-slim AS deb_extractor

# RUN cd /tmp && \
#   apt-get update && apt-get download libicu-dev && \
#   mkdir /dpkg && \
#   for deb in *.deb; do dpkg --extract $deb /dpkg || exit 10; done

# FROM gcr.io/distroless/nodejs20-debian12
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
