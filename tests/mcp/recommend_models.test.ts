import { describe, it, expect, vi } from "vitest";
import { recommendModelsTool, handleRecommendModels } from "../../src/mcp/tools/recommend_models.js";
import type { DebateTalkClient } from "../../src/client.js";

describe("recommend_models tool", () => {
  it("requires question input", () => {
    expect(recommendModelsTool.inputSchema.required).toContain("question");
  });

  it("returns recommended panel", async () => {
    const client = {
      recommendModels: vi.fn().mockResolvedValue({
        debaters: ["claude-opus-4-6", "gpt-5.4", "gemini-3.1-pro"],
        synthesizer: "claude-opus-4-6",
        adjudicator: "gpt-5.4",
        question_type: "business",
      }),
    } as unknown as DebateTalkClient;

    const result = await handleRecommendModels(client, { question: "Should we raise prices?" });
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("business");
    expect(text).toContain("claude-opus-4-6");
    expect(text).toContain("Synthesizer");
  });
});
