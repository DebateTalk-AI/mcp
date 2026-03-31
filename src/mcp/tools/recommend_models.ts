import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DebateTalkClient } from "../../client.js";

export const recommendModelsTool: Tool = {
  name: "recommend_models",
  description:
    "Get the best model panel recommended by DebateTalk smart routing for a specific question. " +
    "Returns the ideal debaters, synthesizer, and adjudicator based on the question type. " +
    "No API key required.",
  inputSchema: {
    type: "object",
    properties: {
      question: {
        type: "string",
        description: "The question or topic you want to debate",
      },
    },
    required: ["question"],
  },
};

export async function handleRecommendModels(
  client: DebateTalkClient,
  args: { question: string }
) {
  const rec = await client.recommendModels(args.question);

  const debaterList = rec.debaters.join(", ");

  return {
    content: [
      {
        type: "text" as const,
        text: [
          `Recommended panel for "${args.question}"`,
          `Question type: ${rec.question_type}`,
          ``,
          `Debaters: ${debaterList}`,
          `Synthesizer: ${rec.synthesizer}`,
          `Adjudicator: ${rec.adjudicator}`,
          ``,
          `To use this panel, run a debate with models: ${rec.debaters.join(", ")}`,
        ].join("\n"),
      },
    ],
  };
}
