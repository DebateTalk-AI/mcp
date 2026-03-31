import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DebateTalkClient } from "../../client.js";

export const getModelStatusTool: Tool = {
  name: "get_model_status",
  description:
    "Get real-time health, latency, and uptime for all DebateTalk models. " +
    "Use this before running a debate to check which models are currently online. " +
    "No API key required.",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export async function handleGetModelStatus(client: DebateTalkClient) {
  const { models, updated_at } = await client.getModelStatus();

  const rows = models
    .map((m) => {
      const latency = m.latency_ms != null ? `${m.latency_ms}ms` : "—";
      const uptime =
        m.uptime_pct != null ? `${m.uptime_pct.toFixed(1)}%` : "—";
      const statusIcon =
        m.status === "online" ? "✓" : m.status === "degraded" ? "⚠" : "✗";
      return `${statusIcon} ${m.display_name} (${m.provider}) — ${m.status}, latency: ${latency}, uptime: ${uptime}`;
    })
    .join("\n");

  const online = models.filter((m) => m.status === "online").length;
  const total = models.length;

  return {
    content: [
      {
        type: "text" as const,
        text: `Model Status — ${online}/${total} online (updated ${updated_at})\n\n${rows}`,
      },
    ],
  };
}
