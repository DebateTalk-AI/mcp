// ── Debate ────────────────────────────────────────────────────────────────────

export interface DebateParams {
  question: string;
  models?: string[];
  rounds?: number;
}

export type DebateEventType =
  | "debate_created"
  | "debate_start"
  | "classification"
  | "model_routing"
  | "round_start"
  | "round_end"
  | "model_response"
  | "consensus_check"
  | "consensus"
  | "deliberation"
  | "synthesis_start"
  | "synthesis"
  | "accuracy"
  | "final"
  | "debate_complete"
  | "done"
  | "error";

export interface DebateEvent {
  type: DebateEventType;
  /** Some events nest payload under `data`, others are flat. Use helper to access. */
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SynthesisData {
  final_answer: string;
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
  title: string | null;
  question_preview: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  rounds_completed: number;
  max_rounds: number;
  consensus_reached: boolean | null;
  models_config: Record<string, unknown>;
  tier_at_time: string;
  total_tokens: number | null;
  cost_usd: number | null;
  is_watermarked: boolean;
  audit_export_url: string | null;
}

export interface HistoryPagination {
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
}

export interface HistoryResponse {
  debates: HistoryItem[];
  pagination: HistoryPagination;
}

// ── Errors ────────────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
