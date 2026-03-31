import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { DebateTalkError, type DebateTalkClient } from "../../client.js";
import type { SynthesisData } from "../../types.js";

export const runDebateTool: Tool = {
  name: "run_debate",
  description:
    "Run a structured multi-model AI debate on any question. Use this tool when the user asks to 'debate', 'use DebateTalk', 'use DT', 'multi-model', 'multi model', 'get a second opinion', 'stress-test' an idea, or wants multiple AI perspectives on a decision. " +
    "Also use it proactively for high-stakes decisions where a single AI answer is insufficient — architecture choices, hiring decisions, strategic bets, predictions, or anything with genuine uncertainty. " +
    "Multiple AI models argue independently in a blind round, deliberate, and converge on a 4-part synthesis: " +
    "Strong Ground (what all models agree on), Fault Lines (genuine disagreements), " +
    "Blind Spots (what all models missed), and Your Call (actionable recommendation). " +
    "Requires an API key (Managed or Enterprise plan). Free tier: 5 debates/day.",
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

function log(server: Server, message: string) {
  server.sendLoggingMessage({ level: "info", data: message });
}

export async function handleRunDebate(
  client: DebateTalkClient,
  server: Server,
  args: { question: string; models?: string[]; rounds?: number }
) {
  let debateId = "";
  let questionType = "";
  let models: string[] = [];
  let synthesis: SynthesisData | null = null;
  let consensusScore: number | null = null;
  let totalRounds = 0;
  let costUsd: number | null = null;
  let shareUrl: string | null = null;
  // Track last response per model (overwritten each round to show final position)
  const modelResponses: Map<string, { answer: string; confidence: number }> = new Map();

  try {
    for await (const event of client.streamDebate(args)) {
      const d = (key: string) => event[key] ?? event.data?.[key];

      if (event.type === "debate_created") {
        const did = d("debate_id");
        if (typeof did === "string") debateId = did;
        const title = d("title");
        log(server, `📋 Debate created: ${title || args.question}`);
      }

      if (event.type === "model_routing") {
        const m = d("models");
        if (Array.isArray(m)) {
          log(server, `🔀 Models selected: ${m.join(", ")}`);
        }
      }

      if (event.type === "classification") {
        const qt = d("question_type");
        questionType = typeof qt === "string" ? qt : "";
        const rationale = d("rationale");
        log(server, `🏷️ Classified as ${questionType}${rationale ? ` — ${rationale}` : ""}`);
      }

      if (event.type === "debate_start") {
        if (!debateId) {
          const did = d("debate_id");
          if (typeof did === "string") debateId = did;
        }
        const m = d("models");
        models = Array.isArray(m) ? (m as string[]) : [];
      }

      if (event.type === "round_start") {
        const round = d("round");
        const phase = d("phase");
        log(server, `🔄 Round ${round} — ${phase}`);
      }

      if (event.type === "model_response") {
        const name = d("name") as string | undefined;
        const data = (event.data ?? event) as Record<string, unknown>;
        const inner = (typeof data["data"] === "object" && data["data"] !== null)
          ? data["data"] as Record<string, unknown>
          : data;
        const answer = inner["answer"] as string | undefined;
        const confidence = inner["confidence"] as number | undefined;
        if (name) {
          const confStr = confidence != null ? ` (confidence: ${(confidence * 100).toFixed(0)}%)` : "";
          const preview = answer ? answer.slice(0, 200) + (answer.length > 200 ? "…" : "") : "";
          log(server, `💬 ${name}${confStr}: ${preview}`);
          if (answer && !("error" in inner)) {
            modelResponses.set(name, {
              answer: answer,
              confidence: confidence ?? 0,
            });
          }
        }
      }

      if (event.type === "consensus") {
        const data = (event.data ?? event) as Record<string, unknown>;
        const result = (typeof data["result"] === "object" && data["result"] !== null)
          ? data["result"] as Record<string, unknown>
          : data;
        const score = result["score"] as number | undefined;
        const reached = d("reached");
        if (score != null) consensusScore = score;
        log(server, `🤝 Consensus${score != null ? ` score: ${score}%` : ""}${reached ? " — threshold reached" : ""}`);
      }

      if (event.type === "final") {
        const tr = d("total_rounds");
        if (typeof tr === "number") totalRounds = tr;
      }

      if (event.type === "synthesis_start") {
        log(server, `✨ Synthesizing final answer…`);
      }

      if (event.type === "debate_complete") {
        const cost = d("cost_usd");
        if (typeof cost === "number") costUsd = cost;
        const url = d("share_url");
        if (typeof url === "string") shareUrl = url;
        const costStr = costUsd != null ? ` · Cost: $${costUsd.toFixed(4)}` : "";
        log(server, `✅ Debate complete${costStr}${shareUrl ? ` — ${shareUrl}` : ""}`);
      }

      if (event.type === "synthesis") {
        const s = (event.data ?? event) as Record<string, unknown>;
        const stringify = (v: unknown): string =>
          typeof v === "string" ? v : Array.isArray(v) ? v.map((item, i) => `${i + 1}. ${item}`).join("\n") : String(v ?? "");
        const fa = s["final_answer"];
        const sg = s["strong_ground"];
        const fl = s["fault_lines"];
        const bs = s["blind_spots"];
        const yc = s["your_call"];
        if (sg != null && fl != null && bs != null && yc != null) {
          synthesis = {
            final_answer: stringify(fa),
            strong_ground: stringify(sg),
            fault_lines: stringify(fl),
            blind_spots: stringify(bs),
            your_call: stringify(yc),
          };
        }
      }
    }
  } catch (err) {
    const message =
      err instanceof DebateTalkError
        ? `DebateTalk API error (${err.status}): ${err.message}`
        : `Debate failed: ${err instanceof Error ? err.message : String(err)}`;
    return { content: [{ type: "text" as const, text: message }], isError: true };
  }

  if (!synthesis) {
    const id = debateId ? `Debate ${debateId}` : "Debate";
    return {
      content: [
        {
          type: "text" as const,
          text: `${id} completed but synthesis was not produced. Check your plan limits at https://console.debatetalk.ai`,
        },
      ],
    };
  }

  const { final_answer, strong_ground, fault_lines, blind_spots, your_call } = synthesis;
  const modelList = models.length > 0 ? models.join(", ") : "smart routing";

  const lines: string[] = [
    `DebateTalk — ${questionType || "Unknown"} question`,
    `Question: "${args.question}"`,
    `Models: ${modelList}`,
    `Rounds: ${totalRounds}${consensusScore != null ? ` · Consensus: ${consensusScore}%` : ""}${costUsd != null ? ` · Cost: $${costUsd.toFixed(4)}` : ""}`,
    `Debate ID: ${debateId}`,
  ];

  // Final answer — the main conclusion
  if (final_answer) {
    lines.push(``, `━━━ Final Answer ━━━`, final_answer);
  }

  // Individual model positions (final round)
  if (modelResponses.size > 0) {
    lines.push(``, `━━━ Model Positions ━━━`);
    for (const [name, resp] of modelResponses) {
      lines.push(`**${name}** (${(resp.confidence * 100).toFixed(0)}% confidence):`);
      lines.push(resp.answer);
      lines.push(``);
    }
  }

  // Synthesis sections
  lines.push(
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
  );

  if (shareUrl) {
    lines.push(``, `🔗 ${shareUrl}`);
  }

  return {
    content: [{ type: "text" as const, text: lines.join("\n") }],
  };
}
