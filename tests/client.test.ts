import { describe, it, expect, vi, beforeEach } from "vitest";
import { DebateTalkClient, DebateTalkError } from "../src/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockJson(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    body: null,
  };
}

describe("DebateTalkClient", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sends Authorization header when API key provided", async () => {
    mockFetch.mockResolvedValue(mockJson({ models: [] }));
    const client = new DebateTalkClient("dt_test");
    await client.getModelStatus();
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer dt_test");
  });

  it("omits Authorization header for public endpoints when no key", async () => {
    mockFetch.mockResolvedValue(mockJson({ models: [] }));
    const client = new DebateTalkClient();
    await client.getModelStatus();
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Authorization"]).toBeUndefined();
  });

  it("throws DebateTalkError on non-ok response", async () => {
    mockFetch.mockResolvedValue(mockJson({ error: { code: "unauthorized", message: "Invalid key" } }, 401));
    const client = new DebateTalkClient("dt_bad");
    await expect(client.getHistory()).rejects.toThrow(DebateTalkError);
  });

  it("throws when calling authenticated method without key", async () => {
    const client = new DebateTalkClient();
    await expect(client.getHistory()).rejects.toThrow("DEBATETALK_API_KEY is required");
  });

  it("getHistory calls correct endpoint with limit param", async () => {
    mockFetch.mockResolvedValue(mockJson({ debates: [], total: 0 }));
    const client = new DebateTalkClient("dt_test");
    await client.getHistory(5);
    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("/v1/user/history?limit=5");
  });
});
