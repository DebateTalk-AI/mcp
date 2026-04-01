import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DebateTalkClient } from "../../client.js";

export const getHistoryTool: Tool = {
  name: "get_history",
  description:
    "Retrieve your past DebateTalk debates. " +
    "Returns debate titles, dates, model counts, and share links. " +
    "Requires an API key. Get one at https://console.debatetalk.ai/api-keys.",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Number of debates to return (default: 20, max: 100)",
      },
    },
  },
};

export async function handleGetHistory(
  client: DebateTalkClient,
  args: { limit?: number }
) {
  const raw = args.limit ?? 20;
  const limit = Number.isFinite(raw) ? Math.min(Math.max(1, raw), 100) : 20;
  const { debates, pagination } = await client.getHistory(limit);

  if (debates.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: "No debates found. Run your first debate at https://console.debatetalk.ai",
        },
      ],
    };
  }

  const rows = debates.map((d) => {
    const date = new Date(d.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const modelCount = Object.keys(d.models_config || {}).length;
    const costStr = d.cost_usd != null ? ` · $${d.cost_usd.toFixed(4)}` : "";
    return `• [${date}] ${d.title || d.question_preview} (${modelCount} models, ${d.status}${costStr})`;
  });

  return {
    content: [
      {
        type: "text" as const,
        text: [
          `Debate history — showing ${debates.length} of ${pagination.total}`,
          ``,
          ...rows,
        ].join("\n"),
      },
    ],
  };
}
