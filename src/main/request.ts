import { net } from "electron";
import { stringify } from "qs";

function request<T>(options: RequestOptions): Promise<RequestResponse<T>> {
  return new Promise((resolve, reject) => {
    const { url, data, headers = {} } = options;

    const request = net.request({
      url,
    });

    Object.entries(headers).forEach(([key, value]) => {
      request.setHeader(key, value);
    });

    if (data) {
      request.write(stringify(data));
    }

    request.on("response", (response) => {
      let data = "";
      response.on("data", (chunk) => (data += chunk));
      response.on("end", () => {
        try {
          data = JSON.parse(data);
        } catch (e) {
          // empty
        }
        const resp: RequestResponse<T> = {
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          headers: response.headers,
          data: data as any,
        };
        if (response.statusCode >= 200 && response.statusCode < 500) {
          resolve(resp);
        } else {
          reject(new Error(`error code: ${response.statusCode}`));
        }
      });
    });

    request.on("error", (err) => {
      reject(err);
    });

    request.end();
  });
}

export default request;
