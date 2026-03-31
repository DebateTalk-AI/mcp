# DebateTalk MCP

[![npm version](https://img.shields.io/npm/v/@debatetalk/mcp.svg)](https://www.npmjs.com/package/@debatetalk/mcp)
[![npm downloads](https://img.shields.io/npm/dm/@debatetalk/mcp.svg)](https://www.npmjs.com/package/@debatetalk/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

> Official MCP server and CLI for [DebateTalk](https://debatetalk.ai) — run structured multi-model AI debates from your AI assistant or terminal.

DebateTalk makes multiple AI models argue a question independently, challenge each other's reasoning, and converge on a structured synthesis: **Strong Ground, Fault Lines, Blind Spots, and Your Call.**

---

## Demo

> Video walkthrough coming soon

---

## Features

- **MCP server** — connect Claude Desktop, Cursor, or any MCP-compatible client to DebateTalk
- **CLI** — run debates and check model status from the terminal
- **Streaming progress** — real-time round-by-round updates via MCP logging notifications
- **Cost & share links** — every debate shows cost and a shareable URL
- **5 tools:** `run_debate`, `get_model_status`, `recommend_models`, `estimate_cost`, `get_history`

> **Try without an API key** — `dt models` and `dt recommend` work instantly, no signup needed. See which models are online and get a recommended panel for your question before committing to a plan.

---

## Quickstart

### Claude Code — plugin marketplace

**1. Add the DebateTalk marketplace:**

```
/plugin marketplace add DebateTalk-AI/mcp
```

**2. Install the plugin:**

```
/plugin install debatetalk@debatetalk-mcp
```

**3. Set your API key:**

Get a key at [console.debatetalk.ai/api-keys](https://console.debatetalk.ai/api-keys), then add it to `~/.claude/settings.json`:

```json
{
  "pluginConfigs": {
    "debatetalk@debatetalk-mcp": {
      "options": {
        "api_key": "dt_your_key_here"
      }
    }
  }
}
```

Then run `/reload-plugins` — the five DebateTalk tools are immediately available in your session.

---

### MCP (Claude Desktop, Cursor, Cline, Goose, and any MCP-compatible client)

**1. Get an API key**

Create a key at [console.debatetalk.ai/api-keys](https://console.debatetalk.ai/api-keys). Requires a Pro or Enterprise plan. Free tier: 5 debates/day.

**2. Add to your MCP client config**

```json
{
  "mcpServers": {
    "dt": {
      "command": "npx",
      "args": ["-y", "@debatetalk/mcp"],
      "env": {
        "DEBATETALK_API_KEY": "dt_your_key_here"
      }
    }
  }
}
```

Config file locations:
- **Claude Desktop (Mac):** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Desktop (Windows):** `%APPDATA%\Claude\claude_desktop_config.json`
- **Claude Code:** `~/.claude/settings.json` (under `mcpServers`)
- **Cursor:** `.cursor/mcp.json` in your project root
- **Windsurf:** `~/.codeium/windsurf/mcp_config.json`
- **Cline / Roo Code:** MCP settings panel in VS Code extension
- **Goose:** `~/.config/goose/config.yaml` (under `extensions`)
- **Other clients:** refer to your client's MCP documentation

**3. Ask your AI assistant to run a debate**

MCP clients read the tool description to decide when to call it — no exact phrasing required. Any of these work:

> *"debate whether we should rewrite our backend in Go"*
> *"use DT — should we raise our Series A now?"*
> *"multi-model this: is Rust worth learning in 2026?"*
> *"stress-test this architecture decision"*
> *"get a second opinion on moving to microservices"*

Claude will also invoke it proactively for high-stakes decisions where a single AI answer is insufficient.

**Example — Cursor:**

Ask Cursor's AI chat: *"use the run_debate tool — should we switch from REST to GraphQL?"*

Cursor calls the MCP tool, streams progress, and returns the full synthesis inline in your chat.

**Example — Cline (VS Code):**

In Cline's agent chat: *"debate: is our current auth middleware secure enough for SOC 2?"*

Cline detects the `run_debate` tool from the MCP server and runs the debate. Results appear in the Cline output panel.

---

### CLI

Install globally:

```bash
npm install -g @debatetalk/mcp
```

Set your API key:

```bash
export DEBATETALK_API_KEY=dt_your_key_here
```

**Run a debate:**
```bash
dt debate "Should we adopt microservices?"
```

Example output:

```
- Starting debate…
✔ Debate complete

"Should we adopt microservices?"
Cost: $0.0842

━━━ STRONG GROUND ━━━
1. Microservices suit orgs with 50+ engineers and distinct team boundaries
2. Monoliths are simpler to operate at small scale
3. Migration costs are consistently underestimated

━━━ FAULT LINES ━━━
1. If teams need independent deploy cycles, then microservices — otherwise monolith
2. If operational maturity is low, then monolith — otherwise microservices are viable
3. If data consistency is critical, then monolith avoids distributed transaction pain

━━━ BLIND SPOTS ━━━
1. Cost of distributed tracing and observability tooling
2. Team cognitive load increases with service count
3. Shared database patterns can bridge the gap

━━━ YOUR CALL ━━━
1. Do you have dedicated platform engineering?
2. Are teams already blocked on shared deploy cycles?
3. Can you afford 6+ months of migration investment?

🔗 https://console.debatetalk.ai/share/a1b2c3d4-5678-90ab-cdef-1234567890ab
```

**Check which models are online:**
```bash
dt models
```

**Get a recommended model panel for your question:**
```bash
dt recommend "Is Rust worth learning in 2026?"
```

**Estimate cost before running:**
```bash
dt cost "Should we raise our Series A now?"
```

**View past debates:**
```bash
dt history
dt history --limit 5
```

---

## MCP Tools Reference

| Tool | Auth required | Description |
|------|--------------|-------------|
| `run_debate` | Yes | Run a structured multi-model debate (streaming) |
| `get_model_status` | No | Real-time health and latency for all models |
| `recommend_models` | No | Get the best model panel for your question |
| `estimate_cost` | Yes | Estimate credit cost before running |
| `get_history` | Yes | List your past debates |

### `run_debate`

```
question     string   required   The question or topic to debate
models       array    optional   Specific model IDs to use (omit for smart routing)
rounds       number   optional   Number of deliberation rounds (default: 2)
```

### `get_model_status`

No parameters. Returns live health, latency, and uptime per model.

### `recommend_models`

```
question     string   required   The question — routing picks the strongest panel
```

### `estimate_cost`

```
question     string   required
models       array    optional
rounds       number   optional
```

### `get_history`

```
limit        number   optional   Number of debates to return (default: 20, max: 100)
```

---

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `DEBATETALK_API_KEY` | For authenticated tools | Your API key from console.debatetalk.ai |

Public tools (`get_model_status`, `recommend_models`) work without an API key.

---

## Plans & Limits

| Plan | Debates/day | API keys | Debaters |
|------|-------------|----------|---------|
| Free | 5 | — | 3 |
| Pro | Unlimited | 2 | 5 |
| Enterprise | Unlimited | Unlimited | 10 |

[Full pricing →](https://debatetalk.ai/resources/plans-and-limits)

---

## Development

```bash
git clone https://github.com/DebateTalk-AI/mcp
cd mcp
npm install
npm run build
npm test
```

**Run MCP server locally:**
```bash
DEBATETALK_API_KEY=dt_your_key npm run dev:mcp
```

**Run CLI locally:**
```bash
DEBATETALK_API_KEY=dt_your_key npm run dev:cli -- debate "your question"
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Issues and PRs welcome.

---

## License

MIT — see [LICENSE](./LICENSE).
