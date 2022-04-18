import { downloader } from "../src";

jest.setTimeout(1000000);

test("downloader", async () => {
  const params = {
    url: "https://ukzy.ukubf3.com/20220409/WtaJj2Hy/index.m3u8",
    path: "C:\\Users\\caorushizi\\Desktop\\test-desktop",
    name: "斗罗大陆 1",
  };

  await downloader(params);
});

test("downloader 1", async () => {
  const params = {
    url: "https://iqiyi.sd-play.com/20211017/vQZfIgIp/index.m3u8",
    path: "C:\\Users\\caorushizi\\Desktop\\test-desktop",
    name: "斗罗大陆 11",
  };

  await downloader(params);
});
