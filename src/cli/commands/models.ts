import { Command } from "commander";
import chalk from "chalk";
import { DebateTalkClient } from "../../client.js";
import { handleError } from "../utils.js";

export function modelsCommand(): Command {
  return new Command("models")
    .description("Show real-time health and latency for all DebateTalk models")
    .action(async () => {
      const client = new DebateTalkClient();
      try {
        const { models, updated_at } = await client.getModelStatus();
        const online = models.filter((m) => m.status === "online").length;
        console.log(
          chalk.bold(`Model Status`) +
            chalk.dim(` — ${online}/${models.length} online (updated ${updated_at})`)
        );
        console.log();
        for (const m of models) {
          const icon =
            m.status === "online"
              ? chalk.green("✓")
              : m.status === "degraded"
                ? chalk.yellow("⚠")
                : chalk.red("✗");
          const latency =
            m.latency_ms != null ? chalk.dim(` ${m.latency_ms}ms`) : "";
          console.log(`  ${icon} ${m.display_name}${latency}`);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
