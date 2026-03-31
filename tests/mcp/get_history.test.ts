import { describe, it, expect, vi } from "vitest";
import { getHistoryTool, handleGetHistory } from "../../src/mcp/tools/get_history.js";
import type { DebateTalkClient } from "../../src/client.js";

describe("get_history tool", () => {
  it("passes default limit of 20", async () => {
    const client = {
      getHistory: vi.fn().mockResolvedValue({ debates: [], pagination: { page: 1, limit: 20, total: 0, has_more: false } }),
    } as unknown as DebateTalkClient;

    await handleGetHistory(client, {});
    expect(client.getHistory).toHaveBeenCalledWith(20);
  });

  it("formats debate list with dates and status", async () => {
    const client = {
      getHistory: vi.fn().mockResolvedValue({
        pagination: { page: 1, limit: 20, total: 1, has_more: false },
        debates: [
          {
            id: "abc123",
            title: "Should we rewrite in Go?",
            question_preview: "Should we rewrite in Go?",
            status: "completed",
            created_at: "2026-03-29T14:00:00Z",
            models_config: { "claude-opus-4-6": {}, "gpt-5.4": {}, "grok-3": {} },
            cost_usd: 0.0251,
            tier_at_time: "pro",
            rounds_completed: 3,
            max_rounds: 3,
            consensus_reached: true,
            total_tokens: 12000,
            is_watermarked: false,
            audit_export_url: null,
            completed_at: "2026-03-29T14:01:00Z",
          },
        ],
      }),
    } as unknown as DebateTalkClient;

    const result = await handleGetHistory(client, {});
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("Should we rewrite in Go?");
    expect(text).toContain("3 models");
    expect(text).toContain("$0.0251");
  });

  it("handles empty history gracefully", async () => {
    const client = {
      getHistory: vi.fn().mockResolvedValue({ debates: [], pagination: { page: 1, limit: 20, total: 0, has_more: false } }),
    } as unknown as DebateTalkClient;

    const result = await handleGetHistory(client, {});
    expect(result.content[0]?.text).toContain("No debates found");
  });
});
