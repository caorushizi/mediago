FROM node:20-bookworm-slim AS runner

RUN apt-get update && apt-get install -y \
  libssl-dev \
  libffi-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN npm install --global pm2
RUN npm i @mediago/player @mediago/core @mediago/deps typeorm better-sqlite3

COPY .mediago-server ./

EXPOSE 8899
EXPOSE 9800

CMD ["pm2-runtime", "backend/index.cjs"]
