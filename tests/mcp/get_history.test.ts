import { describe, it, expect, vi } from "vitest";
import { getHistoryTool, handleGetHistory } from "../../src/mcp/tools/get_history.js";
import type { DebateTalkClient } from "../../src/client.js";

describe("get_history tool", () => {
  it("passes default limit of 20", async () => {
    const client = {
      getHistory: vi.fn().mockResolvedValue({ debates: [], total: 0 }),
    } as unknown as DebateTalkClient;

    await handleGetHistory(client, {});
    expect(client.getHistory).toHaveBeenCalledWith(20);
  });

  it("formats debate list with dates and status", async () => {
    const client = {
      getHistory: vi.fn().mockResolvedValue({
        total: 1,
        debates: [
          {
            id: "abc123",
            title: "Should we rewrite in Go?",
            question: "Should we rewrite in Go?",
            status: "completed",
            created_at: "2026-03-29T14:00:00Z",
            model_count: 3,
            share_token: "tok_xyz",
          },
        ],
      }),
    } as unknown as DebateTalkClient;

    const result = await handleGetHistory(client, {});
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("Should we rewrite in Go?");
    expect(text).toContain("3 models");
    expect(text).toContain("tok_xyz");
  });

  it("handles empty history gracefully", async () => {
    const client = {
      getHistory: vi.fn().mockResolvedValue({ debates: [], total: 0 }),
    } as unknown as DebateTalkClient;

    const result = await handleGetHistory(client, {});
    expect(result.content[0]?.text).toContain("No debates found");
  });
});
