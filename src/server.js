import Koa from "koa";

export default function createServer() {
  const app = new Koa();

  app.use(async (ctx) => {
    ctx.body = "Hello World";
  });

  app.listen(7789);
}
