import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { DebateTalkClient } from "../client.js";
import { runDebateTool, handleRunDebate } from "./tools/run_debate.js";
import { getModelStatusTool, handleGetModelStatus } from "./tools/get_model_status.js";
import { recommendModelsTool, handleRecommendModels } from "./tools/recommend_models.js";
import { estimateCostTool, handleEstimateCost } from "./tools/estimate_cost.js";
import { getHistoryTool, handleGetHistory } from "./tools/get_history.js";

export const ALL_TOOLS = [
  runDebateTool,
  getModelStatusTool,
  recommendModelsTool,
  estimateCostTool,
  getHistoryTool,
];

function createServer(client: DebateTalkClient): Server {
  const server = new Server(
    { name: "debatetalk", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ALL_TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    switch (name) {
      case "run_debate":
        return handleRunDebate(client, args as Parameters<typeof handleRunDebate>[1]);
      case "get_model_status":
        return handleGetModelStatus(client);
      case "recommend_models":
        return handleRecommendModels(client, args as Parameters<typeof handleRecommendModels>[1]);
      case "estimate_cost":
        return handleEstimateCost(client, args as Parameters<typeof handleEstimateCost>[1]);
      case "get_history":
        return handleGetHistory(client, args as Parameters<typeof handleGetHistory>[1]);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  return server;
}

async function main() {
  const client = new DebateTalkClient();
  const server = createServer(client);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Only start the server when run directly, not when imported in tests
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err: unknown) => {
    process.stderr.write(
      `DebateTalk MCP server error: ${err instanceof Error ? err.message : String(err)}\n`
    );
    process.exit(1);
  });
}
