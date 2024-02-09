#!/usr/bin/env zx
import {createRequire as __$$createRequireN} from 'module';var require=__$$createRequireN(import.meta.url);
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};

// node_modules/.pnpm/tsno@2.0.0/node_modules/tsno/dist/client.js
import { createRequire as __$$createRequire } from "module";
var require2;
var init_client = __esm({
  "node_modules/.pnpm/tsno@2.0.0/node_modules/tsno/dist/client.js"() {
    require2 = __$$createRequire("file:///Users/diaozhenyuan/Workspace/Program/m3u8-downloader/node_modules/.pnpm/tsno@2.0.0/node_modules/tsno/dist/client.js");
  }
});

// scripts/check.ts
var check_exports = {};
var init_check = __esm({
  "scripts/check.ts"() {
    init_client();
  }
});

// scripts/pre-commit.ts
init_client();
import { $ } from "zx";
console.log("\u5F00\u59CB\u6267\u884C\u4EE3\u7801\u8D28\u91CF\u8BC4\u4F30...\n");
await Promise.resolve().then(() => (init_check(), check_exports)).catch((out) => {
  throw new Error("\u4EE3\u7801\u8D28\u91CF\u8BC4\u4F30\u5931\u8D25, \u8BF7\u68C0\u67E5\u4EE3\u7801");
});
console.log('printf "\u68C0\u6D4B\u901A\u8FC7, \u521B\u5EFA commit \u4E2D...\n');
await $`git add .`;
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibm9kZV9tb2R1bGVzLy5wbnBtL3Rzbm9AMi4wLjAvbm9kZV9tb2R1bGVzL3Rzbm8vZGlzdC9jbGllbnQuanMiLCAic2NyaXB0cy9jaGVjay50cyIsICJzY3JpcHRzL3ByZS1jb21taXQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7Y3JlYXRlUmVxdWlyZSBhcyBfXyQkY3JlYXRlUmVxdWlyZX0gZnJvbSAnbW9kdWxlJzt2YXIgcmVxdWlyZT1fXyQkY3JlYXRlUmVxdWlyZShcImZpbGU6Ly8vVXNlcnMvZGlhb3poZW55dWFuL1dvcmtzcGFjZS9Qcm9ncmFtL20zdTgtZG93bmxvYWRlci9ub2RlX21vZHVsZXMvLnBucG0vdHNub0AyLjAuMC9ub2RlX21vZHVsZXMvdHNuby9kaXN0L2NsaWVudC5qc1wiKTtcbmltcG9ydCB7XG4gIGNvbG9yc1xufSBmcm9tIFwiLi9jaHVuay1GSERYWE9LWS5qc1wiO1xuXG5cbi8vIHNyYy9jbGllbnQudHNcbnZhciBmZXRjaCA9ICh1cmwsIGluaXQpID0+IGltcG9ydChcIi4vc3JjLTRRN1E2N0MzLmpzXCIpLnRoZW4oKHJlcykgPT4gcmVzLmRlZmF1bHQodXJsLCBpbml0KSk7XG52YXIgYXhpb3MgPSAoY29uZmlnKSA9PiBpbXBvcnQoXCIuL2F4aW9zLVBJWjRDNVVaLmpzXCIpLnRoZW4oKHJlcykgPT4gcmVzLmRlZmF1bHQoY29uZmlnKSk7XG5leHBvcnQge1xuICBheGlvcyxcbiAgY29sb3JzLFxuICBmZXRjaFxufTtcbiIsICIjIS91c3IvYmluL2VudiB6eFxuXG5pbXBvcnQgdHlwZSB7IFByb2Nlc3NPdXRwdXQgfSBmcm9tICd6eCdcbmltcG9ydCB7ICQgfSBmcm9tICd6eCdcbmltcG9ydCB7IHByaW50T2JqZWN0IH0gZnJvbSAnLi91dGlscydcblxuLy8gYXdhaXQgJGBwbnBtIHNwZWxsY2hlY2tgLmNhdGNoKChvdXQ6IFByb2Nlc3NPdXRwdXQpID0+IHtcbi8vICAgY29uc29sZS5sb2cob3V0KVxuXG4vLyAgIHRocm93IG5ldyBFcnJvcihvdXQuc3Rkb3V0KVxuLy8gfSlcblxuLy8gLy8gY2hlY2sgdHlwZSBhbmQgc3RhZ2Vcbi8vIGF3YWl0IFByb21pc2UuYWxsKFskYHBucG0gdHlwZS1jaGVja2AsICRgcG5wbSBsaW50OnN0YWdlYF0pLmNhdGNoKChvdXQ6IFByb2Nlc3NPdXRwdXQpID0+IHtcbi8vICAgcHJpbnRPYmplY3Qob3V0KVxuLy8gICB0aHJvdyBuZXcgRXJyb3Iob3V0LnN0ZG91dClcbi8vIH0pXG4iLCAiIyEvdXNyL2Jpbi9lbnYgenhcblxuaW1wb3J0IHsgJCB9IGZyb20gJ3p4J1xuXG5jb25zb2xlLmxvZygnXHU1RjAwXHU1OUNCXHU2MjY3XHU4ODRDXHU0RUUzXHU3ODAxXHU4RDI4XHU5MUNGXHU4QkM0XHU0RjMwLi4uXFxuJylcblxuYXdhaXQgaW1wb3J0KCcuL2NoZWNrJykuY2F0Y2goKG91dCkgPT4ge1xuICB0aHJvdyBuZXcgRXJyb3IoJ1x1NEVFM1x1NzgwMVx1OEQyOFx1OTFDRlx1OEJDNFx1NEYzMFx1NTkzMVx1OEQyNSwgXHU4QkY3XHU2OEMwXHU2N0U1XHU0RUUzXHU3ODAxJylcbn0pXG5cbmNvbnNvbGUubG9nKCdwcmludGYgXCJcdTY4QzBcdTZENEJcdTkwMUFcdThGQzcsIFx1NTIxQlx1NUVGQSBjb21taXQgXHU0RTJELi4uXFxuJylcblxuYXdhaXQgJGBnaXQgYWRkIC5gXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7OztBQUFBLFNBQVEsaUJBQWlCLHlCQUF3QjtBQUFqRCxJQUE4REE7QUFBOUQ7QUFBQTtBQUEwRCxJQUFJQSxXQUFRLGtCQUFrQiw2SEFBNkg7QUFBQTtBQUFBOzs7QUNBck47QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7QUNBQTtBQUVBLFNBQVMsU0FBUztBQUVsQixRQUFRLElBQUksbUVBQWlCO0FBRTdCLE1BQU0sNERBQWtCLE1BQU0sQ0FBQyxRQUFRO0FBQ3JDLFFBQU0sSUFBSSxNQUFNLGtGQUFpQjtBQUNuQyxDQUFDO0FBRUQsUUFBUSxJQUFJLG1FQUFnQztBQUU1QyxNQUFNOyIsCiAgIm5hbWVzIjogWyJyZXF1aXJlIl0KfQo=
