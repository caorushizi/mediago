export async function wait(seconds: number): Promise<void> {
  return await new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}
