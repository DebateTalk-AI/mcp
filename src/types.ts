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
  data: Record<string, unknown>;
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
