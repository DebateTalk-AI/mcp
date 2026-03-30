# DebateTalk MCP

> Official MCP server and CLI for [DebateTalk](https://debatetalk.ai) — run structured multi-model AI debates from your AI assistant or terminal.

DebateTalk makes multiple AI models argue a question independently, challenge each other's reasoning, and converge on a structured synthesis: **Strong Ground, Fault Lines, Blind Spots, and Your Call.**

---

## Features

- **MCP server** — connect Claude Desktop, Cursor, or any MCP-compatible client to DebateTalk
- **CLI** — run debates and check model status from the terminal
- **Streaming output** — debates stream in real time via SSE
- **5 tools:** `run_debate`, `get_model_status`, `recommend_models`, `estimate_cost`, `get_history`

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

Add your API key to `~/.claude/settings.json`:

```json
{
  "pluginConfigs": {
    "debatetalk@debatetalk-mcp": {
      "options": {
        "DEBATETALK_API_KEY": "dt_your_key_here"
      }
    }
  }
}
```

Get a key at [console.debatetalk.ai/api-keys](https://console.debatetalk.ai/api-keys). Then run `/reload-plugins` — the five DebateTalk tools are immediately available in your session.

---

### MCP (Claude Desktop, Cursor, Cline, Goose, and any MCP-compatible client)

**1. Get an API key**

Create a key at [console.debatetalk.ai/api-keys](https://console.debatetalk.ai/api-keys). Requires a Pro or Enterprise plan. Free tier: 5 debates/day.

**2. Add to your MCP client config**

```json
{
  "mcpServers": {
    "debatetalk": {
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
debatetalk debate "Should we adopt microservices?"
```

**Check which models are online:**
```bash
debatetalk models
```

**Get a recommended model panel for your question:**
```bash
debatetalk recommend "Is Rust worth learning in 2026?"
```

**Estimate cost before running:**
```bash
debatetalk cost "Should we raise our Series A now?"
```

**View past debates:**
```bash
debatetalk history
debatetalk history --limit 5
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
cd debatetalk-mcp
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
