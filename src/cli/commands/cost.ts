import { Command } from "commander";
import chalk from "chalk";
import { DebateTalkClient } from "../../client.js";
import { handleError } from "../utils.js";

export function costCommand(): Command {
  return new Command("cost")
    .description("Estimate the credit cost of a debate before running it")
    .argument("<question>", "The question to estimate cost for")
    .option("--rounds <n>", "Number of deliberation rounds", "2")
    .action(async (question: string, opts: { rounds: string }) => {
      const client = new DebateTalkClient();
      try {
        const est = await client.estimateCost({
          question,
          rounds: parseInt(opts.rounds, 10),
        });
        console.log(chalk.bold(`Cost estimate`));
        console.log();
        console.log(
          `  ${chalk.cyan("Total:")} ${est.estimated_credits} credits` +
            chalk.dim(` (~$${est.estimated_usd.toFixed(2)} USD)`)
        );
        console.log();
        console.log(chalk.dim("  Breakdown:"));
        for (const b of est.breakdown) {
          console.log(
            chalk.dim(
              `    • ${b.model} (${b.role}): ~${b.estimated_tokens.toLocaleString()} tokens = ${b.estimated_credits} credits`
            )
          );
        }
      } catch (err) {
        handleError(err);
      }
    });
}
