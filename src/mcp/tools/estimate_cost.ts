import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DebateTalkClient } from "../../client.js";

export const estimateCostTool: Tool = {
  name: "estimate_cost",
  description:
    "Estimate the credit cost of a debate before running it. " +
    "Returns total credits, USD cost, and a per-model breakdown. " +
    "Requires an API key (Pro or Enterprise plan).",
  inputSchema: {
    type: "object",
    properties: {
      question: {
        type: "string",
        description: "The question to estimate cost for",
      },
      models: {
        type: "array",
        items: { type: "string" },
        description: "Specific model IDs to use (omit for smart routing)",
      },
      rounds: {
        type: "number",
        description: "Number of deliberation rounds (default: 2)",
      },
    },
    required: ["question"],
  },
};

export async function handleEstimateCost(
  client: DebateTalkClient,
  args: { question: string; models?: string[]; rounds?: number }
) {
  const estimate = await client.estimateCost(args);

  const breakdownRows = estimate.breakdown
    .map(
      (b) =>
        `  • ${b.model} (${b.role}): ~${b.estimated_tokens.toLocaleString()} tokens = ${b.estimated_credits} credits`
    )
    .join("\n");

  return {
    content: [
      {
        type: "text" as const,
        text: [
          `Cost estimate for "${args.question}"`,
          ``,
          `Total: ${estimate.estimated_credits} credits (~$${estimate.estimated_usd.toFixed(2)} USD)`,
          ``,
          `Breakdown:`,
          breakdownRows,
          ``,
          `Credits refill automatically on Pro plans. View balance at https://console.debatetalk.ai`,
        ].join("\n"),
      },
    ],
  };
}
