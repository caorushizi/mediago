FROM node:20 AS builder

WORKDIR /app

COPY ./packages/backend/dist /app

COPY ./packages/backend/package*.json ./

RUN npm install --omit=dev

RUN npm rebuild

FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y libicu-dev ffmpeg

WORKDIR /app

COPY --from=builder /app /app

RUN npm install pm2 -g

EXPOSE 8899

CMD ["pm2-runtime", "server/index.js"]
