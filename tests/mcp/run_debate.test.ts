import { describe, it, expect, vi } from "vitest";
import { runDebateTool, handleRunDebate } from "../../src/mcp/tools/run_debate.js";
import type { DebateTalkClient } from "../../src/client.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

const mockServer = {
  sendLoggingMessage: vi.fn(),
} as unknown as Server;

function mockClientWithEvents(events: Record<string, unknown>[]) {
  async function* gen() {
    for (const e of events) yield e;
  }
  return {
    streamDebate: vi.fn().mockReturnValue(gen()),
  } as unknown as DebateTalkClient;
}

describe("run_debate tool", () => {
  it("requires question input", () => {
    expect(runDebateTool.inputSchema.required).toContain("question");
  });

  it("formats synthesis into structured output", async () => {
    const client = mockClientWithEvents([
      { type: "debate_created", debate_id: "dbt_123", title: "Test" },
      { type: "classification", question_type: "business" },
      { type: "debate_start", models: ["claude-opus-4-6", "gpt-5.4"], question: "Should we migrate?" },
      {
        type: "synthesis",
        data: {
          strong_ground: ["Microservices suit orgs with 50+ engineers."],
          fault_lines: ["Teams disagree on operational overhead."],
          blind_spots: ["Cost of distributed tracing ignored."],
          your_call: ["Wait until clear team boundaries exist."],
        },
      },
      { type: "debate_complete", cost_usd: 0.0342, share_url: "https://console.debatetalk.ai/share/abc-123" },
      { type: "done" },
    ]);

    const result = await handleRunDebate(client, mockServer, { question: "Should we migrate to microservices?" });
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("Strong Ground");
    expect(text).toContain("Fault Lines");
    expect(text).toContain("Blind Spots");
    expect(text).toContain("Your Call");
    expect(text).toContain("dbt_123");
    expect(text).toContain("$0.0342");
    expect(text).toContain("https://console.debatetalk.ai/share/abc-123");
  });

  it("handles missing synthesis gracefully", async () => {
    const client = mockClientWithEvents([
      { type: "debate_created", debate_id: "dbt_456", title: "Test" },
      { type: "debate_start", models: [], question: "test" },
      { type: "done" },
    ]);

    const result = await handleRunDebate(client, mockServer, { question: "test" });
    expect(result.content[0]?.text).toContain("completed but synthesis was not produced");
  });
});
