import { spawn } from "child_process";

const exec = (n, p, u) =>
  new Promise((resolve, reject) => {
    const args = ["--path", p, "--name", n, "--url", u];
    const command = spawn("mediago", args);
    let errMsg = "";

    command.stdout.on("data", (data) => {
      console.log(data.toString());
    });

    command.stderr.on("data", (data) => {
      errMsg += data;
    });

    command.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(errMsg));
      } else {
        resolve();
      }
    });
  });

const successFn = (data) => ({ code: 0, msg: "", data });
const failFn = (code, msg) => ({ code, msg, data: null });

export { exec, successFn, failFn };
