FROM m.daocloud.io/docker.io/library/node:20 AS builder

WORKDIR /app

COPY ./packages/backend/dist /app

COPY ./packages/backend/package*.json ./

RUN npm install --omit=dev --registry=https://registry.npmmirror.com

RUN npm rebuild

FROM m.daocloud.io/docker.io/library/node:20-bookworm

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 8899

CMD ["server/index.js"]
