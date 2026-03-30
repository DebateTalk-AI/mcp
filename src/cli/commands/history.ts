import { Command } from "commander";
import chalk from "chalk";
import { DebateTalkClient } from "../../client.js";
import { handleError } from "../utils.js";

export function historyCommand(): Command {
  return new Command("history")
    .description("List your past debates")
    .option("--limit <n>", "Number of debates to show", "20")
    .action(async (opts: { limit: string }) => {
      const client = new DebateTalkClient();
      try {
        const rawLimit = parseInt(opts.limit, 10);
        const { debates, total } = await client.getHistory(
          Number.isNaN(rawLimit) ? 20 : Math.min(Math.max(1, rawLimit), 100)
        );
        if (debates.length === 0) {
          console.log(chalk.dim('No debates yet. Run: dt debate "your question"'));
          return;
        }
        console.log(
          chalk.bold(`Debate history`) +
            chalk.dim(` — showing ${debates.length} of ${total}`)
        );
        console.log();
        for (const d of debates) {
          const date = new Date(d.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          const share = d.share_token
            ? chalk.dim(` → https://console.debatetalk.ai/share/${d.share_token}`)
            : "";
          console.log(
            `  ${chalk.dim(date)}  ${d.title}` +
              chalk.dim(` (${d.model_count} models, ${d.status})`) +
              share
          );
        }
      } catch (err) {
        handleError(err);
      }
    });
}
