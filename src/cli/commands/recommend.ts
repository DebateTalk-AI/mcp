import { Command } from "commander";
import chalk from "chalk";
import { DebateTalkClient } from "../../client.js";
import { handleError } from "../utils.js";

export function recommendCommand(): Command {
  return new Command("recommend")
    .description("Get the best model panel for a question")
    .argument("<question>", "The question to get recommendations for")
    .action(async (question: string) => {
      const client = new DebateTalkClient();
      try {
        const rec = await client.recommendModels(question);
        console.log(chalk.bold(`Recommended panel`) + chalk.dim(` for "${question}"`));
        console.log(chalk.dim(`Question type: ${rec.question_type}`));
        console.log();
        console.log(`  ${chalk.cyan("Debaters:")}    ${rec.debaters.join(", ")}`);
        console.log(`  ${chalk.cyan("Synthesizer:")} ${rec.synthesizer}`);
        console.log(`  ${chalk.cyan("Adjudicator:")} ${rec.adjudicator}`);
      } catch (err) {
        handleError(err);
      }
    });
}
