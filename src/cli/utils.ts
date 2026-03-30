import chalk from "chalk";
import { DebateTalkError } from "../client.js";

export function handleError(err: unknown): never {
  if (err instanceof DebateTalkError) {
    if (err.status === 401 || err.status === 403) {
      console.error(chalk.red("Authentication failed."));
      console.error(
        chalk.dim(
          "Set DEBATETALK_API_KEY or create a key at https://console.debatetalk.ai/api-keys"
        )
      );
    } else if (err.status === 429) {
      console.error(chalk.red("Rate limit reached."));
      console.error(chalk.dim("Free plan: 5 debates/day. Upgrade at https://debatetalk.ai"));
    } else {
      console.error(chalk.red(`API error (${err.status}): ${err.message}`));
    }
  } else if (err instanceof Error) {
    console.error(chalk.red(err.message));
  } else {
    console.error(chalk.red("An unexpected error occurred."));
  }
  process.exit(1);
}

