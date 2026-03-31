import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { DebateTalkClient } from "../../client.js";
import { handleError } from "../utils.js";
import type { DebateEvent } from "../../types.js";

/** Access a field from a flat or nested event. */
function d(event: DebateEvent, key: string): unknown {
  return event[key] ?? event.data?.[key];
}

function stringify(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map((item, i) => `${i + 1}. ${item}`).join("\n");
  return String(v ?? "");
}

export function debateCommand(): Command {
  return new Command("debate")
    .description("Run a structured multi-model AI debate")
    .argument("<question>", "The question or topic to debate")
    .option(
      "--models <ids>",
      "Comma-separated model IDs (omit for smart routing)"
    )
    .option("--rounds <n>", "Number of deliberation rounds (default: 2)")
    .action(
      async (
        question: string,
        opts: { models?: string; rounds?: string }
      ) => {
        const client = new DebateTalkClient();
        const params = {
          question,
          ...(opts.models && { models: opts.models.split(",").map((s) => s.trim()) }),
          ...(opts.rounds && { rounds: parseInt(opts.rounds, 10) }),
        };

        const spinner = ora("Starting debate…").start();

        try {
          let currentPhase = "";
          let costUsd: number | null = null;
          let shareUrl: string | null = null;
          let synthesisEvent: DebateEvent | null = null;

          for await (const event of client.streamDebate(params)) {
            const phase = getPhaseLabel(event);
            if (phase && phase !== currentPhase) {
              currentPhase = phase;
              spinner.text = phase;
            }

            if (event.type === "synthesis") {
              synthesisEvent = event;
            }

            if (event.type === "debate_complete") {
              const cost = d(event, "cost_usd");
              if (typeof cost === "number") costUsd = cost;
              const url = d(event, "share_url");
              if (typeof url === "string") shareUrl = url;
            }
          }

          if (synthesisEvent) {
            spinner.succeed("Debate complete");
            printSynthesis(question, synthesisEvent, costUsd, shareUrl);
          } else {
            spinner.fail("Debate ended without synthesis");
          }
        } catch (err) {
          spinner.fail("Debate failed");
          handleError(err);
        }
      }
    );
}

function getPhaseLabel(event: DebateEvent): string | null {
  switch (event.type) {
    case "debate_start":
      return "Debate starting…";
    case "classification":
      return `Classifying question (${(d(event, "question_type") as string | undefined) ?? "…"})`;
    case "round_start":
      return `Round ${(d(event, "round") as number | undefined) ?? "?"} — models deliberating…`;
    case "consensus":
      return "Checking consensus…";
    case "synthesis_start":
      return "Generating synthesis…";
    default:
      return null;
  }
}

function printSynthesis(question: string, event: DebateEvent, costUsd: number | null, shareUrl: string | null): void {
  const s = (event.data ?? event) as Record<string, unknown>;
  console.log();
  console.log(chalk.bold(`"${question}"`));
  if (costUsd != null) console.log(chalk.dim(`Cost: $${costUsd.toFixed(4)}`));
  console.log();
  console.log(chalk.bold.green("━━━ STRONG GROUND ━━━"));
  console.log(stringify(s["strong_ground"]));
  console.log();
  console.log(chalk.bold.yellow("━━━ FAULT LINES ━━━"));
  console.log(stringify(s["fault_lines"]));
  console.log();
  console.log(chalk.bold.magenta("━━━ BLIND SPOTS ━━━"));
  console.log(stringify(s["blind_spots"]));
  console.log();
  console.log(chalk.bold.cyan("━━━ YOUR CALL ━━━"));
  console.log(stringify(s["your_call"]));
  if (shareUrl) {
    console.log();
    console.log(chalk.dim(`🔗 ${shareUrl}`));
  }
  console.log();
}
