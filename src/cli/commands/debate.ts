import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { DebateTalkClient } from "../../client.js";
import { handleError } from "../utils.js";
import type { DebateEvent } from "../../types.js";

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

          for await (const event of client.streamDebate(params)) {
            const phase = getPhaseLabel(event);
            if (phase && phase !== currentPhase) {
              currentPhase = phase;
              spinner.text = phase;
            }

            if (event.type === "synthesis") {
              spinner.succeed("Debate complete");
              printSynthesis(question, event);
              return;
            }
          }

          spinner.fail("Debate ended without synthesis");
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
      return `Classifying question (${(event.data["question_type"] as string | undefined) ?? "…"})`;
    case "round_start":
      return `Round ${(event.data["round"] as number | undefined) ?? "?"} — models deliberating…`;
    case "consensus":
      return "Checking consensus…";
    case "synthesis":
      return "Generating synthesis…";
    default:
      return null;
  }
}

function printSynthesis(question: string, event: DebateEvent): void {
  const d = event.data as Record<string, string>;
  console.log();
  console.log(chalk.bold(`"${question}"`));
  console.log();
  console.log(chalk.bold.green("━━━ STRONG GROUND ━━━"));
  console.log(d["strong_ground"] ?? "");
  console.log();
  console.log(chalk.bold.yellow("━━━ FAULT LINES ━━━"));
  console.log(d["fault_lines"] ?? "");
  console.log();
  console.log(chalk.bold.magenta("━━━ BLIND SPOTS ━━━"));
  console.log(d["blind_spots"] ?? "");
  console.log();
  console.log(chalk.bold.cyan("━━━ YOUR CALL ━━━"));
  console.log(d["your_call"] ?? "");
  console.log();
}
