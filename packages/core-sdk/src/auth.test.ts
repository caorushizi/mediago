import { describe, expect, it, vi } from "vitest";
import { MediaGoClient } from "./client";

describe("authentication API contract", () => {
  it("sends initialization proof only in the setup body and uses password login", async () => {
    const client = new MediaGoClient({ baseURL: "http://127.0.0.1:9900" });
    const post = vi
      .spyOn(client.api, "post")
      .mockResolvedValue({ success: true, data: "test-key" });
    await client.setupAuth("test-password", "test-initialization-proof");
    expect(post).toHaveBeenLastCalledWith("/api/auth/setup", {
      password: "test-password",
      setupToken: "test-initialization-proof",
    });
    await client.signin("test-password");
    expect(post).toHaveBeenLastCalledWith("/api/auth/signin", {
      password: "test-password",
    });
    post.mockRestore();
  });
});
