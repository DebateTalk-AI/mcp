import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DebateTalkClient } from "../../client.js";

export const runDebateTool: Tool = {
  name: "run_debate",
  description:
    "Run a structured multi-model AI debate on any question. Use this tool when the user asks to 'debate', 'use DebateTalk', 'use DT', 'multi-model', 'multi model', 'get a second opinion', 'stress-test' an idea, or wants multiple AI perspectives on a decision. " +
    "Also use it proactively for high-stakes decisions where a single AI answer is insufficient — architecture choices, hiring decisions, strategic bets, predictions, or anything with genuine uncertainty. " +
    "Multiple AI models argue independently in a blind round, deliberate, and converge on a 4-part synthesis: " +
    "Strong Ground (what all models agree on), Fault Lines (genuine disagreements), " +
    "Blind Spots (what all models missed), and Your Call (actionable recommendation). " +
    "Requires an API key (Pro or Enterprise plan). Free tier: 5 debates/day.",
  inputSchema: {
    type: "object",
    properties: {
      question: {
        type: "string",
        description:
          "The question or topic to debate. Can be a decision, prediction, factual question, or open-ended topic.",
      },
      models: {
        type: "array",
        items: { type: "string" },
        description:
          "Specific model IDs to use as debaters (e.g. [\"claude-opus-4-6\", \"gpt-5.4\"]). " +
          "Omit to let DebateTalk smart routing pick the best panel automatically.",
      },
      rounds: {
        type: "number",
        description: "Number of deliberation rounds (default: 2, max depends on plan)",
      },
    },
    required: ["question"],
  },
};

export async function handleRunDebate(
  client: DebateTalkClient,
  args: { question: string; models?: string[]; rounds?: number }
) {
  const result = await client.runDebate(args);

  if (!result.synthesis) {
    return {
      content: [
        {
          type: "text" as const,
          text: `debate completed — ${result.debate_id} — but synthesis was not produced. Check your plan limits at https://console.debatetalk.ai`,
        },
      ],
    };
  }

  const { strong_ground, fault_lines, blind_spots, your_call } =
    result.synthesis;

  const modelList =
    result.models.length > 0 ? result.models.join(", ") : "smart routing";

  return {
    content: [
      {
        type: "text" as const,
        text: [
          `DebateTalk — ${result.question_type} question`,
          `Question: "${result.question}"`,
          `Models: ${modelList}`,
          `Debate ID: ${result.debate_id}`,
          ``,
          `━━━ Strong Ground ━━━`,
          `What all models agreed on:`,
          strong_ground,
          ``,
          `━━━ Fault Lines ━━━`,
          `Where models genuinely disagreed:`,
          fault_lines,
          ``,
          `━━━ Blind Spots ━━━`,
          `What all models missed:`,
          blind_spots,
          ``,
          `━━━ Your Call ━━━`,
          your_call,
        ].join("\n"),
      },
    ],
  };
}
