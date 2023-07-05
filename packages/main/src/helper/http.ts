import axios from "axios";
import https from "https";

const agent = new https.Agent({
  rejectUnauthorized: false,
});

// 创建 axios 实例，并指定自定义的 HTTPS Agent
const instance = axios.create({
  httpsAgent: agent,
});

export default instance;
