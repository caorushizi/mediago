import { is } from "electron-util";
import { download } from "electron-dl";
import axios from "axios";
import { globWrapper } from "./utils";
import { workspace } from "./variables";
import logger from "./logger";

const ffmpegReg = /ffmpeg/;
const mediagoReg = /mediago/;
const m3u8DLReg = /N_m3u8DL-CLI_/;

export default async function initEnvironment(mainWindow) {
  logger.info("开始初始化软件运行环境~");
  // 开始初始化运行环境
  if (is.windows) {
    const files = await globWrapper("*.exe");

    try {
      if (!files.some((fileName) => mediagoReg.test(fileName))) {
        // 开始下载 mediago
        const url = "http://static.ziying.site/mediago.exe";
        await download(mainWindow, url, { directory: workspace });
      }
    } catch (e) {
      logger.info("初始化 mediago 失败：", e);
    }

    try {
      if (!files.some((fileName) => m3u8DLReg.test(fileName))) {
        // 开始下载 m3u8DL
        const resp = await axios.get(
          "https://github.com/nilaoda/N_m3u8DL-CLI/releases/latest",
          {
            maxRedirects: 0,
            validateStatus: null,
          }
        );
        const redirectUrl = resp.headers.location;
        const latestVer = redirectUrl.replace(
          "https://github.com/nilaoda/N_m3u8DL-CLI/releases/tag/",
          ""
        );
        const giteeUrl = `https://gitee.com/nilaoda/N_m3u8DL-CLI/raw/master/N_m3u8DL-CLI_v${latestVer}.exe`;
        await download(mainWindow, giteeUrl, { directory: workspace });
      }
    } catch (e) {
      logger.info("初始化 m3u8DL 失败：", e);
    }

    // 使用七牛云加速下载
    try {
      if (!files.some((fileName) => ffmpegReg.test(fileName))) {
        // 开始下载 ffmpeg
        const url = "http://static.ziying.site/ffmpeg.exe";
        await download(mainWindow, url, { directory: workspace });
      }
    } catch (e) {
      logger.info("初始化 ffmpeg 失败：", e);
    }

    // try {
    //   if (!files.some((fileName) => ffmpegReg.test(fileName))) {
    //     // 开始下载 ffmpeg
    //     const { data: version } = await axios.get(
    //       "https://www.gyan.dev/ffmpeg/builds/release-version"
    //     );
    //     const filename = `ffmpeg-${version}-essentials_build.zip`;
    //     const name = `ffmpeg-${version}-essentials_build`;
    //
    //     const filepath = path.resolve(workspaceTemp, filename);
    //     // 文件不存在的话则从网上下载
    //     if (!fs.existsSync(filepath)) {
    //       await download(
    //         mainWindow,
    //         `https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip`,
    //         { directory: workspaceTemp, filename }
    //       );
    //     }
    //
    //     const zip = new AdmZip(path.resolve(workspaceTemp, filename));
    //     const entry = `${name}/bin/ffmpeg.exe`;
    //     zip.extractEntryTo(entry, workspace, false, true, "ffmpeg.exe");
    //   }
    // } catch (e) {
    //   logger.info("初始化 ffmpeg 失败：", e);
    // }
  }
}
