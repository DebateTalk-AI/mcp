import { describe, it, expect, vi } from "vitest";
import { estimateCostTool, handleEstimateCost } from "../../src/mcp/tools/estimate_cost.js";
import type { DebateTalkClient } from "../../src/client.js";

describe("estimate_cost tool", () => {
  it("requires question input", () => {
    expect(estimateCostTool.inputSchema.required).toContain("question");
  });

  it("formats cost estimate with breakdown", async () => {
    const client = {
      estimateCost: vi.fn().mockResolvedValue({
        estimated_credits: 12,
        estimated_usd: 0.24,
        breakdown: [
          { model: "claude-opus-4-6", role: "debater", estimated_tokens: 4000, estimated_credits: 6 },
          { model: "gpt-5.4", role: "debater", estimated_tokens: 3800, estimated_credits: 6 },
        ],
      }),
    } as unknown as DebateTalkClient;

    const result = await handleEstimateCost(client, { question: "test?" });
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("12 credits");
    expect(text).toContain("$0.24");
    expect(text).toContain("claude-opus-4-6");
  });
});
