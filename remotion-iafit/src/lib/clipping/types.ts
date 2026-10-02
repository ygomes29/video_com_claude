/**
 * Internal domain types for the IAFIT Content Studio clipping module.
 *
 * These are the ONLY shapes the React layer is allowed to depend on.
 * The raw MuAPI schema is kept inside `muapi-client.ts` and never leaks
 * into components (see `highlights.ts` for the normalization layer).
 */

/** IAFIT-specific content categories (V1: not auto-classified yet). */
export type ClipCategory =
  | "TREINAMENTO_COMERCIAL"
  | "ESTRATEGIA_CRESCIMENTO"
  | "OPERACAO_IAFIT"
  | "DOR_DO_CLIENTE"
  | "REACAO_CLIENTE"
  | "OBJECAO"
  | "CASE";

/** Lifecycle of a clipping job / individual clip. Mirrors MuAPI statuses. */
export type ClipStatus =
  | "queued"
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

/** Aspect ratios supported by the MuAI ai-clipping endpoint. */
export type AspectRatio = "9:16" | "1:1" | "4:5";

/**
 * A single normalized clip / highlight.
 * Times are in seconds. Scores are 0–100.
 */
export interface Clip {
  id: string;
  title: string;
  hook: string;
  startTime: number;
  endTime: number;
  /** endTime - startTime, in seconds. */
  duration: number;
  transcript?: string;
  /** Viral potential score 0–100, or null when the provider returns none. */
  viralScore: number | null;
  /** IAFIT relevance score. NOT computed in V1 (kept null). */
  iafitScore?: number | null;
  /** Human-readable reason the clip was selected (MuAPI virality_reason). */
  viralityReason: string;
  categories?: ClipCategory[];
  /** URL of the rendered vertical clip (MP4). */
  clipUrl: string;
  thumbnailUrl?: string;
  status: ClipStatus;
}

/** Request body for POST /api/clips/create. */
export interface CreateClipRequest {
  videoUrl: string;
  numHighlights: number;
  aspectRatio: AspectRatio;
  returnCoordinatesOnly?: boolean;
}

/** Response for POST /api/clips/create. */
export interface CreateClipResponse {
  /** MuAPI request_id — the stateless job handle the client polls with. */
  jobId: string;
  status: ClipStatus;
}

/** Response for GET /api/clips/status. */
export interface ClipJobStatus {
  jobId: string;
  status: ClipStatus;
  /** Coarse UI stage label (representational, not technically precise). */
  stage: string;
  message?: string;
}

/** Response for GET /api/clips/results. */
export interface ClipResultsResponse {
  jobId: string;
  status: ClipStatus;
  clips: Clip[];
}