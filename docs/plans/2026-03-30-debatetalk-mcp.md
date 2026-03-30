# DebateTalk MCP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an open-source MCP server + CLI that lets users run DebateTalk debates from any MCP-compatible AI client or terminal.

**Architecture:** Single TypeScript package (`debatetalk-mcp`) with a shared API client (`src/client.ts`), an MCP server (`src/mcp/server.ts`) that exposes 5 tools, and a CLI (`src/cli/index.ts`) with matching commands. Both the MCP server and CLI share the same client — no duplication.

**Tech Stack:** Node.js 18+, TypeScript 5, `@modelcontextprotocol/sdk`, `commander`, `eventsource-parser`, `chalk`, `ora`, `vitest`, `tsup`

---

## Task 1: Git repo + project scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `LICENSE`

**Step 1: Initialize git repo**

```bash
cd /Users/vlddlv/debatetalk/dt-mcp
git init
```
Expected: `Initialized empty Git repository in .../dt-mcp/.git/`

**Step 2: Create `package.json`**

```json
{
  "name": "debatetalk-mcp",
  "version": "1.0.0",
  "description": "Official MCP server and CLI for DebateTalk — run structured multi-model AI debates from your AI assistant or terminal.",
  "keywords": ["mcp", "ai", "debate", "debatetalk", "claude", "llm"],
  "homepage": "https://debatetalk.ai",
  "bugs": "https://github.com/debatetalk/debatetalk-mcp/issues",
  "repository": {
    "type": "git",
    "url": "https://github.com/debatetalk/debatetalk-mcp.git"
  },
  "license": "MIT",
  "author": "DebateTalk <support@debatetalk.ai>",
  "type": "module",
  "main": "./dist/mcp/server.js",
  "bin": {
    "debatetalk": "./dist/cli/index.js",
    "debatetalk-mcp": "./dist/mcp/server.js"
  },
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsup",
    "dev:mcp": "tsx src/mcp/server.ts",
    "dev:cli": "tsx src/cli/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.10.0",
    "chalk": "^5.3.0",
    "commander": "^12.1.0",
    "eventsource-parser": "^3.0.0",
    "ora": "^8.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsup": "^8.3.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Step 4: Create `tsup.config.ts`**

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "mcp/server": "src/mcp/server.ts",
    "cli/index": "src/cli/index.ts",
  },
  format: ["esm"],
  target: "node18",
  clean: true,
  sourcemap: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
```

**Step 5: Create `.gitignore`**

```
node_modules/
dist/
.env
*.tsbuildinfo
coverage/
```

**Step 6: Create `.env.example`**

```
# Get your API key at https://console.debatetalk.ai/api-keys
# Requires Pro or Enterprise plan. Free tier: 5 debates/day (no key needed).
DEBATETALK_API_KEY=dt_your_key_here
```

**Step 7: Create `LICENSE`**

```
MIT License

Copyright (c) 2026 DebateTalk

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Step 8: Install dependencies**

```bash
npm install
```
Expected: `node_modules/` created, `package-lock.json` written.

**Step 9: Commit**

```bash
git add .
git commit -m "chore: initial project scaffold"
```

---

## Task 2: Shared types

**Files:**
- Create: `src/types.ts`

**Step 1: Create `src/types.ts`**

```typescript
// ── Debate ────────────────────────────────────────────────────────────────────

export interface DebateParams {
  question: string;
  models?: string[];
  rounds?: number;
}

export type DebateEventType =
  | "debate_start"
  | "classification"
  | "round_start"
  | "model_response"
  | "deliberation"
  | "consensus"
  | "synthesis"
  | "accuracy"
  | "final"
  | "error";

export interface DebateEvent {
  type: DebateEventType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

export interface SynthesisData {
  strong_ground: string;
  fault_lines: string;
  blind_spots: string;
  your_call: string;
}

export interface DebateResult {
  debate_id: string;
  question: string;
  question_type: string;
  models: string[];
  synthesis: SynthesisData | null;
  events: DebateEvent[];
}

// ── Model status ──────────────────────────────────────────────────────────────

export type ModelHealth = "online" | "degraded" | "offline";

export interface ModelStatusItem {
  id: string;
  display_name: string;
  provider: string;
  status: ModelHealth;
  latency_ms?: number;
  uptime_pct?: number;
}

export interface ModelStatusResponse {
  models: ModelStatusItem[];
  updated_at: string;
}

// ── Recommend ─────────────────────────────────────────────────────────────────

export interface RecommendResponse {
  debaters: string[];
  synthesizer: string;
  adjudicator: string;
  question_type: string;
}

// ── Cost estimate ─────────────────────────────────────────────────────────────

export interface EstimateCostParams {
  question: string;
  models?: string[];
  rounds?: number;
}

export interface CostBreakdownItem {
  model: string;
  role: string;
  estimated_tokens: number;
  estimated_credits: number;
}

export interface CostEstimate {
  estimated_credits: number;
  estimated_usd: number;
  breakdown: CostBreakdownItem[];
}

// ── History ───────────────────────────────────────────────────────────────────

export interface HistoryItem {
  id: string;
  title: string;
  question: string;
  status: string;
  created_at: string;
  model_count: number;
  share_token?: string;
}

export interface HistoryResponse {
  debates: HistoryItem[];
  total: number;
}

// ── Errors ────────────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

**Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: API client

**Files:**
- Create: `src/client.ts`
- Create: `tests/client.test.ts`

**Step 1: Write the failing test — `tests/client.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DebateTalkClient, DebateTalkError } from "../src/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockJson(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    body: null,
  };
}

describe("DebateTalkClient", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sends Authorization header when API key provided", async () => {
    mockFetch.mockResolvedValue(mockJson({ models: [] }));
    const client = new DebateTalkClient("dt_test");
    await client.getModelStatus();
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer dt_test");
  });

  it("omits Authorization header for public endpoints when no key", async () => {
    mockFetch.mockResolvedValue(mockJson({ models: [] }));
    const client = new DebateTalkClient();
    await client.getModelStatus();
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Authorization"]).toBeUndefined();
  });

  it("throws DebateTalkError on non-ok response", async () => {
    mockFetch.mockResolvedValue(mockJson({ error: { code: "unauthorized", message: "Invalid key" } }, 401));
    const client = new DebateTalkClient("dt_bad");
    await expect(client.getHistory()).rejects.toThrow(DebateTalkError);
  });

  it("throws when calling authenticated method without key", async () => {
    const client = new DebateTalkClient();
    await expect(client.getHistory()).rejects.toThrow("DEBATETALK_API_KEY is required");
  });

  it("getHistory calls correct endpoint with limit param", async () => {
    mockFetch.mockResolvedValue(mockJson({ debates: [], total: 0 }));
    const client = new DebateTalkClient("dt_test");
    await client.getHistory(5);
    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("/v1/user/history?limit=5");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test
```
Expected: FAIL — `Cannot find module '../src/client.js'`

**Step 3: Create `src/client.ts`**

```typescript
import { EventSourceParserStream } from "eventsource-parser/stream";
import type {
  ModelStatusResponse,
  RecommendResponse,
  EstimateCostParams,
  CostEstimate,
  HistoryResponse,
  DebateParams,
  DebateEvent,
  DebateResult,
  ApiErrorBody,
} from "./types.js";

const BASE_URL = "https://engine.debatetalk.ai";

export class DebateTalkError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "DebateTalkError";
  }
}

export class DebateTalkClient {
  private readonly apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env["DEBATETALK_API_KEY"];
  }

  private get authHeaders(): Record<string, string> {
    if (!this.apiKey) return {};
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  private get baseHeaders(): Record<string, string> {
    return { "Content-Type": "application/json", ...this.authHeaders };
  }

  private requireAuth(): void {
    if (!this.apiKey) {
      throw new Error(
        "DEBATETALK_API_KEY is required for this operation. " +
          "Create one at https://console.debatetalk.ai/api-keys"
      );
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: this.baseHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({
        error: { code: "unknown", message: res.statusText },
      })) as ApiErrorBody;
      throw new DebateTalkError(
        res.status,
        payload.error?.message ?? res.statusText,
        payload.error?.code
      );
    }

    return res.json() as Promise<T>;
  }

  // ── Public endpoints (no auth required) ──────────────────────────────────

  async getModelStatus(): Promise<ModelStatusResponse> {
    return this.request<ModelStatusResponse>("GET", "/v1/public/model-status");
  }

  async recommendModels(question: string): Promise<RecommendResponse> {
    return this.request<RecommendResponse>("POST", "/v1/models/recommend", {
      question,
    });
  }

  // ── Authenticated endpoints ───────────────────────────────────────────────

  async estimateCost(params: EstimateCostParams): Promise<CostEstimate> {
    this.requireAuth();
    return this.request<CostEstimate>("POST", "/v1/user/estimate-cost", params);
  }

  async getHistory(limit = 20): Promise<HistoryResponse> {
    this.requireAuth();
    return this.request<HistoryResponse>(
      "GET",
      `/v1/user/history?limit=${limit}`
    );
  }

  async *streamDebate(params: DebateParams): AsyncGenerator<DebateEvent> {
    this.requireAuth();

    const res = await fetch(`${BASE_URL}/debate`, {
      method: "POST",
      headers: { ...this.baseHeaders, Accept: "text/event-stream" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({
        error: { code: "unknown", message: res.statusText },
      })) as ApiErrorBody;
      throw new DebateTalkError(
        res.status,
        payload.error?.message ?? res.statusText,
        payload.error?.code
      );
    }

    if (!res.body) throw new DebateTalkError(0, "No response body");

    const stream = res.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new EventSourceParserStream());

    for await (const event of stream) {
      if (event.type !== "event") continue;
      if (!event.data || event.data === "[DONE]") continue;
      try {
        yield JSON.parse(event.data) as DebateEvent;
      } catch {
        // skip malformed events
      }
    }
  }

  async runDebate(params: DebateParams): Promise<DebateResult> {
    const events: DebateEvent[] = [];
    let debateId = "";
    let questionType = "";
    let models: string[] = [];
    let synthesis = null;

    for await (const event of this.streamDebate(params)) {
      events.push(event);

      if (event.type === "debate_start") {
        debateId = (event.data["debate_id"] as string | undefined) ?? "";
        models = (event.data["models"] as string[] | undefined) ?? [];
      }
      if (event.type === "classification") {
        questionType =
          (event.data["question_type"] as string | undefined) ?? "";
      }
      if (event.type === "synthesis") {
        synthesis = event.data as typeof synthesis;
      }
    }

    return {
      debate_id: debateId,
      question: params.question,
      question_type: questionType,
      models,
      synthesis,
      events,
    };
  }
}
```

**Step 4: Run tests**

```bash
npm test
```
Expected: 5 passing.

**Step 5: Commit**

```bash
git add src/client.ts tests/client.test.ts
git commit -m "feat: add DebateTalkClient with SSE streaming support"
```

---

## Task 4: MCP tool — `get_model_status`

**Files:**
- Create: `src/mcp/tools/get_model_status.ts`
- Create: `tests/mcp/get_model_status.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { getModelStatusTool, handleGetModelStatus } from "../../src/mcp/tools/get_model_status.js";
import type { DebateTalkClient } from "../../src/client.js";

describe("get_model_status tool", () => {
  it("has correct name and no required inputs", () => {
    expect(getModelStatusTool.name).toBe("get_model_status");
    expect(getModelStatusTool.inputSchema.required).toBeUndefined();
  });

  it("returns formatted model list", async () => {
    const client = {
      getModelStatus: vi.fn().mockResolvedValue({
        models: [
          { id: "claude-opus-4-6", display_name: "Claude Opus 4.6", provider: "anthropic", status: "online", latency_ms: 450 },
          { id: "gpt-5.4", display_name: "GPT-5.4", provider: "openai", status: "degraded", latency_ms: 1200 },
        ],
        updated_at: "2026-03-30T10:00:00Z",
      }),
    } as unknown as DebateTalkClient;

    const result = await handleGetModelStatus(client);
    expect(result.content[0]?.type).toBe("text");
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("Claude Opus 4.6");
    expect(text).toContain("online");
    expect(text).toContain("degraded");
  });
});
```

**Step 2: Run to verify fail**

```bash
npm test tests/mcp/get_model_status.test.ts
```
Expected: FAIL — module not found.

**Step 3: Create `src/mcp/tools/get_model_status.ts`**

```typescript
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DebateTalkClient } from "../../client.js";

export const getModelStatusTool: Tool = {
  name: "get_model_status",
  description:
    "Get real-time health, latency, and uptime for all DebateTalk models. " +
    "Use this before running a debate to check which models are currently online. " +
    "No API key required.",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export async function handleGetModelStatus(client: DebateTalkClient) {
  const { models, updated_at } = await client.getModelStatus();

  const rows = models
    .map((m) => {
      const latency = m.latency_ms != null ? `${m.latency_ms}ms` : "—";
      const uptime =
        m.uptime_pct != null ? `${m.uptime_pct.toFixed(1)}%` : "—";
      const statusIcon =
        m.status === "online" ? "✓" : m.status === "degraded" ? "⚠" : "✗";
      return `${statusIcon} ${m.display_name} (${m.provider}) — ${m.status}, latency: ${latency}, uptime: ${uptime}`;
    })
    .join("\n");

  const online = models.filter((m) => m.status === "online").length;
  const total = models.length;

  return {
    content: [
      {
        type: "text" as const,
        text: `Model Status — ${online}/${total} online (updated ${updated_at})\n\n${rows}`,
      },
    ],
  };
}
```

**Step 4: Run tests**

```bash
npm test tests/mcp/get_model_status.test.ts
```
Expected: 2 passing.

**Step 5: Commit**

```bash
git add src/mcp/tools/get_model_status.ts tests/mcp/get_model_status.test.ts
git commit -m "feat: add get_model_status MCP tool"
```

---

## Task 5: MCP tool — `recommend_models`

**Files:**
- Create: `src/mcp/tools/recommend_models.ts`
- Create: `tests/mcp/recommend_models.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { recommendModelsTool, handleRecommendModels } from "../../src/mcp/tools/recommend_models.js";
import type { DebateTalkClient } from "../../src/client.js";

describe("recommend_models tool", () => {
  it("requires question input", () => {
    expect(recommendModelsTool.inputSchema.required).toContain("question");
  });

  it("returns recommended panel", async () => {
    const client = {
      recommendModels: vi.fn().mockResolvedValue({
        debaters: ["claude-opus-4-6", "gpt-5.4", "gemini-3.1-pro"],
        synthesizer: "claude-opus-4-6",
        adjudicator: "gpt-5.4",
        question_type: "business",
      }),
    } as unknown as DebateTalkClient;

    const result = await handleRecommendModels(client, { question: "Should we raise prices?" });
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("business");
    expect(text).toContain("claude-opus-4-6");
    expect(text).toContain("Synthesizer");
  });
});
```

**Step 2: Run to verify fail**

```bash
npm test tests/mcp/recommend_models.test.ts
```
Expected: FAIL.

**Step 3: Create `src/mcp/tools/recommend_models.ts`**

```typescript
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DebateTalkClient } from "../../client.js";

export const recommendModelsTool: Tool = {
  name: "recommend_models",
  description:
    "Get the best model panel recommended by DebateTalk smart routing for a specific question. " +
    "Returns the ideal debaters, synthesizer, and adjudicator based on the question type. " +
    "No API key required.",
  inputSchema: {
    type: "object",
    properties: {
      question: {
        type: "string",
        description: "The question or topic you want to debate",
      },
    },
    required: ["question"],
  },
};

export async function handleRecommendModels(
  client: DebateTalkClient,
  args: { question: string }
) {
  const rec = await client.recommendModels(args.question);

  const debaterList = rec.debaters.join(", ");

  return {
    content: [
      {
        type: "text" as const,
        text: [
          `Recommended panel for "${args.question}"`,
          `Question type: ${rec.question_type}`,
          ``,
          `Debaters: ${debaterList}`,
          `Synthesizer: ${rec.synthesizer}`,
          `Adjudicator: ${rec.adjudicator}`,
          ``,
          `To use this panel, run a debate with models: ${rec.debaters.join(", ")}`,
        ].join("\n"),
      },
    ],
  };
}
```

**Step 4: Run tests**

```bash
npm test tests/mcp/recommend_models.test.ts
```
Expected: 2 passing.

**Step 5: Commit**

```bash
git add src/mcp/tools/recommend_models.ts tests/mcp/recommend_models.test.ts
git commit -m "feat: add recommend_models MCP tool"
```

---

## Task 6: MCP tool — `estimate_cost`

**Files:**
- Create: `src/mcp/tools/estimate_cost.ts`
- Create: `tests/mcp/estimate_cost.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { estimateCostTool, handleEstimateCost } from "../../src/mcp/tools/estimate_cost.js";
import type { DebateTalkClient } from "../../src/client.js";

describe("estimate_cost tool", () => {
  it("requires question input", () => {
    expect(estimateCostTool.inputSchema.required).toContain("question");
  });

  it("formats cost estimate with breakdown", async () => {
    const client = {
      estimateCost: vi.fn().mockResolvedValue({
        estimated_credits: 12,
        estimated_usd: 0.24,
        breakdown: [
          { model: "claude-opus-4-6", role: "debater", estimated_tokens: 4000, estimated_credits: 6 },
          { model: "gpt-5.4", role: "debater", estimated_tokens: 3800, estimated_credits: 6 },
        ],
      }),
    } as unknown as DebateTalkClient;

    const result = await handleEstimateCost(client, { question: "test?" });
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("12 credits");
    expect(text).toContain("$0.24");
    expect(text).toContain("claude-opus-4-6");
  });
});
```

**Step 2: Run to verify fail**

```bash
npm test tests/mcp/estimate_cost.test.ts
```

**Step 3: Create `src/mcp/tools/estimate_cost.ts`**

```typescript
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DebateTalkClient } from "../../client.js";

export const estimateCostTool: Tool = {
  name: "estimate_cost",
  description:
    "Estimate the credit cost of a debate before running it. " +
    "Returns total credits, USD cost, and a per-model breakdown. " +
    "Requires an API key (Pro or Enterprise plan).",
  inputSchema: {
    type: "object",
    properties: {
      question: {
        type: "string",
        description: "The question to estimate cost for",
      },
      models: {
        type: "array",
        items: { type: "string" },
        description: "Specific model IDs to use (omit for smart routing)",
      },
      rounds: {
        type: "number",
        description: "Number of deliberation rounds (default: 2)",
      },
    },
    required: ["question"],
  },
};

export async function handleEstimateCost(
  client: DebateTalkClient,
  args: { question: string; models?: string[]; rounds?: number }
) {
  const estimate = await client.estimateCost(args);

  const breakdownRows = estimate.breakdown
    .map(
      (b) =>
        `  • ${b.model} (${b.role}): ~${b.estimated_tokens.toLocaleString()} tokens = ${b.estimated_credits} credits`
    )
    .join("\n");

  return {
    content: [
      {
        type: "text" as const,
        text: [
          `Cost estimate for "${args.question}"`,
          ``,
          `Total: ${estimate.estimated_credits} credits (~$${estimate.estimated_usd.toFixed(2)} USD)`,
          ``,
          `Breakdown:`,
          breakdownRows,
          ``,
          `Credits refill automatically on Pro plans. View balance at https://console.debatetalk.ai`,
        ].join("\n"),
      },
    ],
  };
}
```

**Step 4: Run tests**

```bash
npm test tests/mcp/estimate_cost.test.ts
```
Expected: 2 passing.

**Step 5: Commit**

```bash
git add src/mcp/tools/estimate_cost.ts tests/mcp/estimate_cost.test.ts
git commit -m "feat: add estimate_cost MCP tool"
```

---

## Task 7: MCP tool — `get_history`

**Files:**
- Create: `src/mcp/tools/get_history.ts`
- Create: `tests/mcp/get_history.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { getHistoryTool, handleGetHistory } from "../../src/mcp/tools/get_history.js";
import type { DebateTalkClient } from "../../src/client.js";

describe("get_history tool", () => {
  it("passes default limit of 20", async () => {
    const client = {
      getHistory: vi.fn().mockResolvedValue({ debates: [], total: 0 }),
    } as unknown as DebateTalkClient;

    await handleGetHistory(client, {});
    expect(client.getHistory).toHaveBeenCalledWith(20);
  });

  it("formats debate list with dates and status", async () => {
    const client = {
      getHistory: vi.fn().mockResolvedValue({
        total: 1,
        debates: [
          {
            id: "abc123",
            title: "Should we rewrite in Go?",
            question: "Should we rewrite in Go?",
            status: "completed",
            created_at: "2026-03-29T14:00:00Z",
            model_count: 3,
            share_token: "tok_xyz",
          },
        ],
      }),
    } as unknown as DebateTalkClient;

    const result = await handleGetHistory(client, {});
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("Should we rewrite in Go?");
    expect(text).toContain("3 models");
    expect(text).toContain("tok_xyz");
  });

  it("handles empty history gracefully", async () => {
    const client = {
      getHistory: vi.fn().mockResolvedValue({ debates: [], total: 0 }),
    } as unknown as DebateTalkClient;

    const result = await handleGetHistory(client, {});
    expect(result.content[0]?.text).toContain("No debates found");
  });
});
```

**Step 2: Run to verify fail**

```bash
npm test tests/mcp/get_history.test.ts
```

**Step 3: Create `src/mcp/tools/get_history.ts`**

```typescript
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DebateTalkClient } from "../../client.js";

export const getHistoryTool: Tool = {
  name: "get_history",
  description:
    "Retrieve your past DebateTalk debates. " +
    "Returns debate titles, dates, model counts, and share links. " +
    "Requires an API key (Pro or Enterprise plan).",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Number of debates to return (default: 20, max: 100)",
      },
    },
  },
};

export async function handleGetHistory(
  client: DebateTalkClient,
  args: { limit?: number }
) {
  const limit = args.limit ?? 20;
  const { debates, total } = await client.getHistory(limit);

  if (debates.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: "No debates found. Run your first debate at https://console.debatetalk.ai",
        },
      ],
    };
  }

  const rows = debates.map((d) => {
    const date = new Date(d.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const shareLink = d.share_token
      ? ` — https://console.debatetalk.ai/share/${d.share_token}`
      : "";
    return `• [${date}] ${d.title} (${d.model_count} models, ${d.status})${shareLink}`;
  });

  return {
    content: [
      {
        type: "text" as const,
        text: [
          `Debate history — showing ${debates.length} of ${total}`,
          ``,
          ...rows,
        ].join("\n"),
      },
    ],
  };
}
```

**Step 4: Run tests**

```bash
npm test tests/mcp/get_history.test.ts
```
Expected: 3 passing.

**Step 5: Commit**

```bash
git add src/mcp/tools/get_history.ts tests/mcp/get_history.test.ts
git commit -m "feat: add get_history MCP tool"
```

---

## Task 8: MCP tool — `run_debate`

**Files:**
- Create: `src/mcp/tools/run_debate.ts`
- Create: `tests/mcp/run_debate.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { runDebateTool, handleRunDebate } from "../../src/mcp/tools/run_debate.js";
import type { DebateTalkClient } from "../../src/client.js";

describe("run_debate tool", () => {
  it("requires question input", () => {
    expect(runDebateTool.inputSchema.required).toContain("question");
  });

  it("formats synthesis into structured output", async () => {
    const client = {
      runDebate: vi.fn().mockResolvedValue({
        debate_id: "dbt_123",
        question: "Should we migrate to microservices?",
        question_type: "business",
        models: ["claude-opus-4-6", "gpt-5.4"],
        synthesis: {
          strong_ground: "Microservices suit orgs with 50+ engineers and distinct team boundaries.",
          fault_lines: "Teams disagree on whether current scale justifies the operational overhead.",
          blind_spots: "Most analyses ignore the cost of distributed tracing and observability tooling.",
          your_call: "Wait until you have clear team ownership boundaries and dedicated platform engineering.",
        },
        events: [],
      }),
    } as unknown as DebateTalkClient;

    const result = await handleRunDebate(client, { question: "Should we migrate to microservices?" });
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("Strong Ground");
    expect(text).toContain("Fault Lines");
    expect(text).toContain("Blind Spots");
    expect(text).toContain("Your Call");
    expect(text).toContain("dbt_123");
  });

  it("handles missing synthesis gracefully", async () => {
    const client = {
      runDebate: vi.fn().mockResolvedValue({
        debate_id: "dbt_456",
        question: "test",
        question_type: "factual",
        models: [],
        synthesis: null,
        events: [],
      }),
    } as unknown as DebateTalkClient;

    const result = await handleRunDebate(client, { question: "test" });
    expect(result.content[0]?.text).toContain("debate completed");
  });
});
```

**Step 2: Run to verify fail**

```bash
npm test tests/mcp/run_debate.test.ts
```

**Step 3: Create `src/mcp/tools/run_debate.ts`**

```typescript
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DebateTalkClient } from "../../client.js";

export const runDebateTool: Tool = {
  name: "run_debate",
  description:
    "Run a structured multi-model AI debate on any question. " +
    "Multiple AI models argue independently in a blind round, deliberate, and converge on a 4-part synthesis: " +
    "Strong Ground (what all models agree on), Fault Lines (genuine disagreements), " +
    "Blind Spots (what all models missed), and Your Call (actionable recommendation). " +
    "Requires an API key (Pro or Enterprise plan). Free tier: 5 debates/day.",
  inputSchema: {
    type: "object",
    properties: {
      question: {
        type: "string",
        description:
          "The question or topic to debate. Can be a decision, prediction, factual question, or open-ended topic.",
      },
      models: {
        type: "array",
        items: { type: "string" },
        description:
          "Specific model IDs to use as debaters (e.g. [\"claude-opus-4-6\", \"gpt-5.4\"]). " +
          "Omit to let DebateTalk smart routing pick the best panel automatically.",
      },
      rounds: {
        type: "number",
        description: "Number of deliberation rounds (default: 2, max depends on plan)",
      },
    },
    required: ["question"],
  },
};

export async function handleRunDebate(
  client: DebateTalkClient,
  args: { question: string; models?: string[]; rounds?: number }
) {
  const result = await client.runDebate(args);

  if (!result.synthesis) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Debate ${result.debate_id} completed but synthesis was not produced. Check your plan limits at https://console.debatetalk.ai`,
        },
      ],
    };
  }

  const { strong_ground, fault_lines, blind_spots, your_call } =
    result.synthesis;

  const modelList =
    result.models.length > 0 ? result.models.join(", ") : "smart routing";

  return {
    content: [
      {
        type: "text" as const,
        text: [
          `DebateTalk — ${result.question_type} question`,
          `Question: "${result.question}"`,
          `Models: ${modelList}`,
          `Debate ID: ${result.debate_id}`,
          ``,
          `━━━ STRONG GROUND ━━━`,
          `What all models agreed on:`,
          strong_ground,
          ``,
          `━━━ FAULT LINES ━━━`,
          `Where models genuinely disagreed:`,
          fault_lines,
          ``,
          `━━━ BLIND SPOTS ━━━`,
          `What all models missed:`,
          blind_spots,
          ``,
          `━━━ YOUR CALL ━━━`,
          your_call,
        ].join("\n"),
      },
    ],
  };
}
```

**Step 4: Run tests**

```bash
npm test tests/mcp/run_debate.test.ts
```
Expected: 2 passing.

**Step 5: Commit**

```bash
git add src/mcp/tools/run_debate.ts tests/mcp/run_debate.test.ts
git commit -m "feat: add run_debate MCP tool"
```

---

## Task 9: MCP server

**Files:**
- Create: `src/mcp/server.ts`
- Create: `tests/mcp/server.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { ALL_TOOLS } from "../../src/mcp/server.js";

describe("MCP server tools registry", () => {
  it("exports all 5 tools", () => {
    const names = ALL_TOOLS.map((t) => t.name);
    expect(names).toContain("run_debate");
    expect(names).toContain("get_model_status");
    expect(names).toContain("recommend_models");
    expect(names).toContain("estimate_cost");
    expect(names).toContain("get_history");
    expect(names).toHaveLength(5);
  });
});
```

**Step 2: Run to verify fail**

```bash
npm test tests/mcp/server.test.ts
```

**Step 3: Create `src/mcp/server.ts`**

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { DebateTalkClient } from "../client.js";
import {
  runDebateTool,
  handleRunDebate,
} from "./tools/run_debate.js";
import {
  getModelStatusTool,
  handleGetModelStatus,
} from "./tools/get_model_status.js";
import {
  recommendModelsTool,
  handleRecommendModels,
} from "./tools/recommend_models.js";
import {
  estimateCostTool,
  handleEstimateCost,
} from "./tools/estimate_cost.js";
import {
  getHistoryTool,
  handleGetHistory,
} from "./tools/get_history.js";

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

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  const client = new DebateTalkClient();
  const server = createServer(client);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  process.stderr.write(
    `DebateTalk MCP server error: ${err instanceof Error ? err.message : String(err)}\n`
  );
  process.exit(1);
});
```

**Step 4: Run tests**

```bash
npm test tests/mcp/server.test.ts
```
Expected: 1 passing.

**Step 5: Run all tests**

```bash
npm test
```
Expected: all passing.

**Step 6: Commit**

```bash
git add src/mcp/server.ts tests/mcp/server.test.ts
git commit -m "feat: add MCP server wiring all 5 tools"
```

---

## Task 10: CLI shared utilities

**Files:**
- Create: `src/cli/utils.ts`

**Step 1: Create `src/cli/utils.ts`**

```typescript
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

export function requireApiKey(): string {
  const key = process.env["DEBATETALK_API_KEY"];
  if (!key) {
    console.error(chalk.red("DEBATETALK_API_KEY is not set."));
    console.error(
      chalk.dim("Create a key at https://console.debatetalk.ai/api-keys")
    );
    process.exit(1);
  }
  return key;
}
```

**Step 2: Commit**

```bash
git add src/cli/utils.ts
git commit -m "feat: add CLI shared error handling utilities"
```

---

## Task 11: CLI commands

**Files:**
- Create: `src/cli/commands/models.ts`
- Create: `src/cli/commands/recommend.ts`
- Create: `src/cli/commands/cost.ts`
- Create: `src/cli/commands/history.ts`
- Create: `src/cli/commands/debate.ts`

**Step 1: Create `src/cli/commands/models.ts`**

```typescript
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
```

**Step 2: Create `src/cli/commands/recommend.ts`**

```typescript
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
```

**Step 3: Create `src/cli/commands/cost.ts`**

```typescript
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
```

**Step 4: Create `src/cli/commands/history.ts`**

```typescript
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
        const { debates, total } = await client.getHistory(
          parseInt(opts.limit, 10)
        );
        if (debates.length === 0) {
          console.log(chalk.dim("No debates yet. Run: debatetalk debate \"your question\""));
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
              chalk.dim(` (${d.model_count} models)`) +
              share
          );
        }
      } catch (err) {
        handleError(err);
      }
    });
}
```

**Step 5: Create `src/cli/commands/debate.ts`**

```typescript
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { DebateTalkClient } from "../../client.js";
import { handleError } from "../utils.js";
import type { DebateEvent } from "../../types.js";

export function debateCommand(): Command {
  return new Command("debate")
    .description("Run a structured multi-model AI debate")
    .argument("<question>", "The question or topic to debate")
    .option(
      "--models <ids>",
      "Comma-separated model IDs (omit for smart routing)"
    )
    .option("--rounds <n>", "Number of deliberation rounds (default: 2)")
    .action(
      async (
        question: string,
        opts: { models?: string; rounds?: string }
      ) => {
        const client = new DebateTalkClient();
        const params = {
          question,
          models: opts.models?.split(",").map((s) => s.trim()),
          rounds: opts.rounds ? parseInt(opts.rounds, 10) : undefined,
        };

        const spinner = ora("Starting debate…").start();

        try {
          let currentPhase = "";

          for await (const event of client.streamDebate(params)) {
            const phase = getPhaseLabel(event);
            if (phase && phase !== currentPhase) {
              currentPhase = phase;
              spinner.text = phase;
            }

            if (event.type === "synthesis") {
              spinner.succeed("Debate complete");
              printSynthesis(question, event);
              return;
            }
          }

          spinner.fail("Debate ended without synthesis");
        } catch (err) {
          spinner.fail("Debate failed");
          handleError(err);
        }
      }
    );
}

function getPhaseLabel(event: DebateEvent): string | null {
  switch (event.type) {
    case "debate_start":
      return "Debate starting…";
    case "classification":
      return `Classifying question (${(event.data["question_type"] as string | undefined) ?? "…"})`;
    case "round_start":
      return `Round ${(event.data["round"] as number | undefined) ?? "?"} — models deliberating…`;
    case "consensus":
      return "Checking consensus…";
    case "synthesis":
      return "Generating synthesis…";
    default:
      return null;
  }
}

function printSynthesis(question: string, event: DebateEvent): void {
  const d = event.data as Record<string, string>;
  console.log();
  console.log(chalk.bold(`"${question}"`));
  console.log();
  console.log(chalk.bold.green("━━━ STRONG GROUND ━━━"));
  console.log(d["strong_ground"] ?? "");
  console.log();
  console.log(chalk.bold.yellow("━━━ FAULT LINES ━━━"));
  console.log(d["fault_lines"] ?? "");
  console.log();
  console.log(chalk.bold.magenta("━━━ BLIND SPOTS ━━━"));
  console.log(d["blind_spots"] ?? "");
  console.log();
  console.log(chalk.bold.cyan("━━━ YOUR CALL ━━━"));
  console.log(d["your_call"] ?? "");
  console.log();
}
```

**Step 6: Commit**

```bash
git add src/cli/commands/
git commit -m "feat: add all 5 CLI commands (debate, models, recommend, cost, history)"
```

---

## Task 12: CLI entry point

**Files:**
- Create: `src/cli/index.ts`

**Step 1: Create `src/cli/index.ts`**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/cli/index.ts
git commit -m "feat: add CLI entry point"
```

---

## Task 13: Build, README, CONTRIBUTING

**Files:**
- Create: `README.md` (use the content from the design doc — see brainstorming output)
- Create: `CONTRIBUTING.md`

**Step 1: Verify build passes**

```bash
npm run build
```
Expected: `dist/` created with `mcp/server.js` and `cli/index.js`. No TypeScript errors.

**Step 2: Run full test suite**

```bash
npm test
```
Expected: all tests passing.

**Step 3: Create `CONTRIBUTING.md`**

```markdown
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
npm test          # run once
npm run test:watch  # watch mode
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
```

**Step 4: Create README.md** (use the full content from the design brainstorming session above)

**Step 5: Verify `npx` invocation works**

```bash
node dist/cli/index.js --help
node dist/mcp/server.js --help 2>/dev/null || echo "MCP server starts (expects stdio)"
```
Expected: CLI help output printed. MCP server starts without crashing.

**Step 6: Final commit**

```bash
git add README.md CONTRIBUTING.md
git commit -m "docs: add README and CONTRIBUTING"
```

---

## Task 14: npm publish setup + final check

**Files:**
- Modify: `package.json` — verify `files`, `bin`, `main` fields
- Create: `.npmignore`

**Step 1: Create `.npmignore`**

```
src/
tests/
docs/
tsup.config.ts
tsconfig.json
.env*
*.tsbuildinfo
```

**Step 2: Dry-run publish**

```bash
npm pack --dry-run
```
Expected: only `dist/`, `README.md`, `LICENSE` listed. No `src/`, `tests/`, or `.env` files.

**Step 3: Final full test + build**

```bash
npm run build && npm test && npm run typecheck
```
Expected: all passing, no errors.

**Step 4: Commit**

```bash
git add .npmignore
git commit -m "chore: add .npmignore, verify publish surface"
```

---

## Done

At this point `debatetalk-mcp` is:
- Fully typed TypeScript with strict mode
- All tools tested
- MCP server ready for `npx debatetalk-mcp` in Claude Desktop / Cursor
- CLI ready for `npm install -g debatetalk-mcp`
- Open-source ready: MIT license, README, CONTRIBUTING, `.env.example`

**To publish:** `npm publish --access public` (requires npm account with `debatetalk` org access).
