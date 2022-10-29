export async function wait(seconds: number): Promise<void> {
  return await new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

// 判断一个字符串是不是一个 url
export function isUrl(s: string) {
  return new URL(s);
}
