import { describe, it, expect, vi } from "vitest";
import { getModelStatusTool, handleGetModelStatus } from "../../src/mcp/tools/get_model_status.js";
import type { DebateTalkClient } from "../../src/client.js";

describe("get_model_status tool", () => {
  it("has correct name and no required inputs", () => {
    expect(getModelStatusTool.name).toBe("get_model_status");
    expect(getModelStatusTool.inputSchema.required).toBeUndefined();
  });

  it("returns formatted model list", async () => {
    const client = {
      getModelStatus: vi.fn().mockResolvedValue({
        models: [
          { id: "claude-opus-4-6", display_name: "Claude Opus 4.6", provider: "anthropic", status: "online", latency_ms: 450 },
          { id: "gpt-5.4", display_name: "GPT-5.4", provider: "openai", status: "degraded", latency_ms: 1200 },
        ],
        updated_at: "2026-03-30T10:00:00Z",
      }),
    } as unknown as DebateTalkClient;

    const result = await handleGetModelStatus(client);
    expect(result.content[0]?.type).toBe("text");
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("Claude Opus 4.6");
    expect(text).toContain("online");
    expect(text).toContain("degraded");
  });
});
