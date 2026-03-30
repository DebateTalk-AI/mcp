import { Command } from "commander";
import { debateCommand } from "./commands/debate.js";
import { modelsCommand } from "./commands/models.js";
import { recommendCommand } from "./commands/recommend.js";
import { costCommand } from "./commands/cost.js";
import { historyCommand } from "./commands/history.js";

const program = new Command();

program
  .name("debatetalk")
  .description(
    "DebateTalk CLI — run structured multi-model AI debates from your terminal.\n" +
      "Docs: https://debatetalk.ai/resources/api-reference"
  )
  .version("1.0.0");

program.addCommand(debateCommand());
program.addCommand(modelsCommand());
program.addCommand(recommendCommand());
program.addCommand(costCommand());
program.addCommand(historyCommand());

program.parse();
