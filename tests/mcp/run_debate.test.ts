import { describe, it, expect, vi } from "vitest";
import { runDebateTool, handleRunDebate } from "../../src/mcp/tools/run_debate.js";
import type { DebateTalkClient } from "../../src/client.js";

describe("run_debate tool", () => {
  it("requires question input", () => {
    expect(runDebateTool.inputSchema.required).toContain("question");
  });

  it("formats synthesis into structured output", async () => {
    const client = {
      runDebate: vi.fn().mockResolvedValue({
        debate_id: "dbt_123",
        question: "Should we migrate to microservices?",
        question_type: "business",
        models: ["claude-opus-4-6", "gpt-5.4"],
        synthesis: {
          strong_ground: "Microservices suit orgs with 50+ engineers and distinct team boundaries.",
          fault_lines: "Teams disagree on whether current scale justifies the operational overhead.",
          blind_spots: "Most analyses ignore the cost of distributed tracing and observability tooling.",
          your_call: "Wait until you have clear team ownership boundaries and dedicated platform engineering.",
        },
        events: [],
      }),
    } as unknown as DebateTalkClient;

    const result = await handleRunDebate(client, { question: "Should we migrate to microservices?" });
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("Strong Ground");
    expect(text).toContain("Fault Lines");
    expect(text).toContain("Blind Spots");
    expect(text).toContain("Your Call");
    expect(text).toContain("dbt_123");
  });

  it("handles missing synthesis gracefully", async () => {
    const client = {
      runDebate: vi.fn().mockResolvedValue({
        debate_id: "dbt_456",
        question: "test",
        question_type: "factual",
        models: [],
        synthesis: null,
        events: [],
      }),
    } as unknown as DebateTalkClient;

    const result = await handleRunDebate(client, { question: "test" });
    expect(result.content[0]?.text).toContain("debate completed");
  });
});
