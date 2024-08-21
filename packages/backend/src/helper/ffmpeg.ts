import { spawn } from "child_process";
import { ffmpegPath } from "./variables.ts";

export const convertToAudio = async (
  input: string,
  output: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath, [
      "-y",
      "-v",
      "error",
      "-i",
      input,
      "-acodec",
      "mp3",
      "-format",
      "mp3",
      output,
    ]);
    let errData = "";

    ffmpeg.stderr.on("data", (data) => {
      errData += String(data);
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(errData));
      }
    });
  });
};
