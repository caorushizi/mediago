const serve = require('koa-static');
const Koa = require('koa');
const app = new Koa();
const path = require('path')

app.use(serve(path.resolve(__dirname, '../example')));

app.listen(3000);
console.log('listening on port 3000');