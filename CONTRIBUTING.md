# Contributing to debatetalk-mcp

Thank you for your interest in contributing!

## Development setup

```bash
git clone https://github.com/debatetalk/debatetalk-mcp
cd debatetalk-mcp
npm install
cp .env.example .env
# Add your DEBATETALK_API_KEY to .env
```

## Running locally

```bash
# MCP server (connects via stdio)
npm run dev:mcp

# CLI
npm run dev:cli -- debate "your question"
npm run dev:cli -- models
```

## Tests

```bash
npm test           # run once
npm run test:watch # watch mode
```

All new tools must have corresponding tests in `tests/`.

## Adding a new tool

1. Create `src/mcp/tools/<tool_name>.ts` — export a `Tool` definition and a `handle*` function.
2. Create `tests/mcp/<tool_name>.test.ts` — test both the schema and the handler.
3. Register the tool in `src/mcp/server.ts` — add to `ALL_TOOLS` and the `switch` in `CallToolRequestSchema`.
4. Add a matching CLI command in `src/cli/commands/<tool_name>.ts` and register it in `src/cli/index.ts`.

## Pull requests

- Keep PRs focused — one feature or fix per PR.
- Include tests.
- Run `npm run typecheck` before submitting.
- Follow the existing code style (strict TypeScript, no `any`).

## Reporting issues

Open an issue at https://github.com/debatetalk/debatetalk-mcp/issues
