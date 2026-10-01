/**
 * Polling + status helpers for the clipping module.
 *
 * The backend is STATELESS in V1: the client holds the MuAPI `jobId`
 * (== request_id) and polls our own `/api/clips/status`, which queries
 * MuAPI live on each call. These helpers are pure and shared by the
 * API routes and the React polling loop.
 */

import type { ClipStatus } from "./types";

/** Client polling cadence (ms). MuAPI jobs take seconds-to-minutes. */
export const POLL_INTERVAL_MS = 3000;

/** Hard client-side polling deadline (ms). ~10 minutes. */
export const POLL_TIMEOUT_MS = 10 * 60 * 1000;

/** Terminal statuses — stop polling once reached. */
export const TERMINAL_STATUSES: ReadonlySet<ClipStatus> = new Set([
  "completed",
  "failed",
  "cancelled",
]);

export function isTerminalStatus(status: ClipStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

/**
 * Coarse, REPRESENTATIONAL stage labels for the processing UI.
 *
 * IMPORTANT: MuAPI does not expose granular per-stage progress in V1.
 * These labels are a visual representation of the underlying pipeline
 * (download → transcribe → rank → render), not a technically precise
 * signal. The UI presents them as an indeterminate sequence.
 */
export const STAGE_LABELS = {
  queued: "Preparando...",
  pending: "Preparando...",
  processing: "Processando...",
  completed: "Concluído",
  failed: "Falhou",
  cancelled: "Cancelado",
} as const satisfies Record<ClipStatus, string>;

/** Sub-stages cycled indeterminately while `processing`. */
export const PROCESSING_SUBSTAGES = [
  "Transcrevendo...",
  "Identificando melhores momentos...",
  "Gerando cortes...",
] as const;

export function statusToStageLabel(status: ClipStatus): string {
  return STAGE_LABELS[status] ?? "Processando...";
}

/**
 * Normalize an opaque status string coming from MuAPI into our ClipStatus.
 * Unknown / unexpected values collapse to `processing` (safer than failing),
 * so the client keeps polling until a terminal status or timeout.
 */
export function normalizeClipStatus(raw: unknown): ClipStatus {
  if (typeof raw !== "string") return "processing";
  const lower = raw.toLowerCase();
  if (lower === "completed" || lower === "succeeded" || lower === "success")
    return "completed";
  if (lower === "failed" || lower === "error") return "failed";
  if (lower === "cancelled" || lower === "canceled") return "cancelled";
  if (lower === "queued") return "queued";
  if (lower === "pending") return "pending";
  if (lower === "processing" || lower === "running") return "processing";
  return "processing";
}