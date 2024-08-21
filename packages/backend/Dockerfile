# 使用官方 Node.js 镜像作为基础镜像
FROM m.daocloud.io/docker.io/library/node:20

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --registry=https://registry.npmmirror.com

# 复制项目文件
COPY . .

RUN npm run build

# 暴露应用运行的端口
EXPOSE 3000

# 启动应用
CMD ["node", "dist/inedx.js"]
