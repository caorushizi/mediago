# 使用官方 Node.js 镜像作为基础镜像
FROM m.daocloud.io/docker.io/library/node:20

# 设置工作目录
WORKDIR /app

# 复制打包产物到工作目录
COPY ./packages/backend/dist /app

# 复制 package.json 和 package-lock.json
COPY ./packages/backend/package*.json ./

# 安装依赖
RUN npm install --registry=https://registry.npmmirror.com

# 暴露应用运行的端口
EXPOSE 8899

# 启动应用
CMD ["node", "server/index.js"]
