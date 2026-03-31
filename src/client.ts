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
  SynthesisData,
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
      ...(body !== undefined && { body: JSON.stringify(body) }),
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
    let synthesis: SynthesisData | null = null;

    for await (const event of this.streamDebate(params)) {
      events.push(event);

      // Helper: events may be flat or nest payload under `data`.
      const d = (key: string) => event[key] ?? event.data?.[key];

      if (event.type === "debate_created") {
        const did = d("debate_id");
        if (typeof did === "string") debateId = did;
      }
      if (event.type === "debate_start") {
        if (!debateId) {
          const did = d("debate_id");
          if (typeof did === "string") debateId = did;
        }
        const m = d("models");
        models = Array.isArray(m) ? (m as string[]) : [];
      }
      if (event.type === "classification") {
        const qt = d("question_type");
        questionType = typeof qt === "string" ? qt : "";
      }
      if (event.type === "synthesis") {
        // Synthesis nests under event.data; fields may be strings or arrays
        const s = (event.data ?? event) as Record<string, unknown>;
        const stringify = (v: unknown): string =>
          typeof v === "string" ? v : Array.isArray(v) ? v.join("\n") : String(v ?? "");
        const sg = s["strong_ground"];
        const fl = s["fault_lines"];
        const bs = s["blind_spots"];
        const yc = s["your_call"];
        if (sg != null && fl != null && bs != null && yc != null) {
          synthesis = {
            strong_ground: stringify(sg),
            fault_lines: stringify(fl),
            blind_spots: stringify(bs),
            your_call: stringify(yc),
          };
        }
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
