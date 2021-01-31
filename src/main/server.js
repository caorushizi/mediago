import Koa from "koa";
import Router from "@koa/router";
import fs from "fs";
import cors from "@koa/cors";
import serve from "koa-static";
import store from "./store";

const VideoRoot = `${store.get("local")}`;

export default function createServer() {
  const app = new Koa();

  const router = new Router();

  router.get("/", (ctx, next) => {
    let result;
    const stat = fs.statSync(VideoRoot);
    if (stat.isDirectory()) {
      const readDir = fs.readdirSync(VideoRoot);
      const reg = /\.mp4$/;

      result = readDir.reduce((res, i) => {
        const x = reg.test(i);
        if (x) res.push(i);
        return res;
      }, []);
    }

    ctx.body = result;
    next();
  });

  app.use(cors());
  app.use(serve(VideoRoot));
  app.use(router.routes()).use(router.allowedMethods());
  app.listen(7789);
}
