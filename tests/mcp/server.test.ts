import { describe, it, expect } from "vitest";
import { ALL_TOOLS } from "../../src/mcp/server.js";

describe("MCP server tools registry", () => {
  it("exports all 5 tools", () => {
    const names = ALL_TOOLS.map((t) => t.name);
    expect(names).toContain("run_debate");
    expect(names).toContain("get_model_status");
    expect(names).toContain("recommend_models");
    expect(names).toContain("estimate_cost");
    expect(names).toContain("get_history");
    expect(names).toHaveLength(5);
  });
});
