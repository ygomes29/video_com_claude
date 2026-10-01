/**
 * MuAPI HTTP transport client.
 *
 * SERVER-ONLY. Never import this from a client component — it reads
 * MUAPI_API_KEY from the environment and must never reach the browser.
 */

import "server-only";

import type { AspectRatio, ClipStatus } from "./types";
import { normalizeClipStatus } from "./polling";

/**
 * This module is intentionally thin: it only speaks the raw MuAPI schema.
 * Domain normalization (raw → Clip[]) lives in `highlights.ts`.
 *
 * Reference: https://muapi.ai/docs/api-reference
 *   POST {BASE}/ai-clipping                       → { request_id, status, cost }
 *   GET  {BASE}/predictions/{request_id}/result   → { id, status, outputs, ... }
 *   statuses: queued | pending | processing | completed | failed | cancelled
 */

/** Default base URL; override with MUAPI_BASE_URL if needed. */
const DEFAULT_BASE_URL = "https://api.muapi.ai/api/v1";

/** Max transient-retry attempts for network blips (timeout / connection reset). */
const MAX_TRANSIENT_RETRIES = 3;
const RETRY_BACKOFF_MS = 2000;

export class MuApiError extends Error {
  readonly status?: number;
  readonly body?: unknown;
  constructor(message: string, opts?: { status?: number; body?: unknown }) {
    super(message);
    this.name = "MuApiError";
    this.status = opts?.status;
    this.body = opts?.body;
  }
}

function getBaseUrl(): string {
  return process.env.MUAPI_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

/** Throws a clear error if the API key is not configured. */
export function requireApiKey(): string {
  const key = process.env.MUAPI_API_KEY?.trim();
  if (!key) {
    throw new MuApiError(
      "MUAPI_API_KEY is not configured. Add it to the server environment.",
    );
  }
  return key;
}

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-api-key": requireApiKey(),
  };
}

/** True for transient network errors worth retrying. */
function isTransient(err: unknown): boolean {
  if (err instanceof MuApiError) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return /timeout|abort|fetch failed|econnreset|enotfound|network/i.test(msg);
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new MuApiError("MuAPI returned invalid (non-JSON) response body.", {
      status: res.status,
      body: text,
    });
  }
}

/** Thin fetch with retries on transient errors only. */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_TRANSIENT_RETRIES; attempt++) {
    try {
      return await fetch(url, init);
    } catch (err) {
      lastErr = err;
      if (!isTransient(err) || attempt === MAX_TRANSIENT_RETRIES) throw err;
      await sleep(RETRY_BACKOFF_MS);
    }
  }
  throw lastErr;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function assertOk(res: Response, body: unknown): void {
  if (res.ok) return;
  const message = extractErrorMessage(body) ?? `MuAPI request failed with HTTP ${res.status}`;
  throw new MuApiError(message, { status: res.status, body });
}

/**
 * Extract a human-readable error message from a MuAPI error body.
 *
 * MuAPI does not use a single error shape — be permissive:
 *   { "message": "..." }
 *   { "detail": "string" }                       (FastAPI default)
 *   { "detail": { "error": "..." } }             (failed job result)
 *   { "detail": [{ "msg": "..." }] }             (FastAPI validation 422)
 */
function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.message === "string" && b.message) return b.message;
  const detail = b.detail;
  if (typeof detail === "string" && detail) return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (first && typeof first === "object" && typeof (first as { msg?: unknown }).msg === "string") {
      return (first as { msg: string }).msg;
    }
  }
  if (detail && typeof detail === "object") {
    const d = detail as Record<string, unknown>;
    if (typeof d.error === "string" && d.error) return d.error;
    if (typeof d.message === "string" && d.message) return d.message;
  }
  return null;
}

/**
 * If a non-OK result response carries a `detail` object with a `status`,
 * it represents a terminal (failed/cancelled) job — not a transport error.
 * Return it as a result so the caller can surface the real status + reason.
 */
function detailAsResult(body: unknown): MuApiResultResponse | null {
  if (!body || typeof body !== "object") return null;
  const detail = (body as { detail?: unknown }).detail;
  if (detail && typeof detail === "object" && "status" in detail) {
    return detail as MuApiResultResponse;
  }
  return null;
}

/* ----------------------------- raw types ----------------------------- */

/** Submit response from POST /ai-clipping. */
export interface MuApiSubmission {
  request_id: string;
  status?: string;
  cost?: unknown;
}

/**
 * A single highlight as returned by MuAPI. Field names are best-effort
 * against the documented schema; `highlights.ts` accesses them defensively.
 */
export interface MuApiShort {
  title?: string;
  start_time?: number;
  end_time?: number;
  score?: number;
  hook_sentence?: string;
  hook?: string;
  virality_reason?: string;
  reason?: string;
  clip_url?: string;
  url?: string;
  thumbnail?: string;
  thumbnail_url?: string;
  transcript?: string;
  [key: string]: unknown;
}

/** Generic / specialized result envelope from the predictions result endpoint. */
export interface MuApiResultResponse {
  id?: string;
  request_id?: string;
  status?: string;
  /** Specialized ai-clipping payload. */
  shorts?: MuApiShort[];
  /** Generic MuAPI output list (URLs or objects). */
  outputs?: unknown[] | Record<string, unknown>;
  cost?: unknown;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

/* ----------------------------- API ops ----------------------------- */

export interface SubmitClipJobParams {
  videoUrl: string;
  numHighlights: number;
  aspectRatio: AspectRatio;
  returnCoordinatesOnly?: boolean;
}

/** Submit an ai-clipping job. Returns the raw submission (request_id). */
export async function submitClipJob(
  params: SubmitClipJobParams,
): Promise<MuApiSubmission> {
  const url = `${getBaseUrl()}/ai-clipping`;
  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      video_url: params.videoUrl,
      num_highlights: params.numHighlights,
      aspect_ratio: params.aspectRatio,
      return_coordinates_only: params.returnCoordinatesOnly ?? false,
    }),
  });
  const body = (await parseJson(res)) as MuApiSubmission | null;
  assertOk(res, body);
  if (!body || !body.request_id) {
    throw new MuApiError(
      "MuAPI submission response had no request_id.",
      { status: res.status, body },
    );
  }
  return body;
}

/** Convenience: just the normalized status for a job. */
export async function getJobStatus(requestId: string): Promise<ClipStatus> {
  const result = await getJobResult(requestId);
  return normalizeClipStatus(result.status);
}

/** Fetch the raw result object for a job. Works for both status + result. */
export async function getJobResult(
  requestId: string,
): Promise<MuApiResultResponse> {
  if (!requestId) throw new MuApiError("Missing jobId (request_id).");
  const url = `${getBaseUrl()}/predictions/${encodeURIComponent(requestId)}/result`;
  const res = await fetchWithRetry(url, { method: "GET", headers: authHeaders() });
  const body = await parseJson(res);
  if (!res.ok) {
    // MuAPI signals a failed/cancelled job with HTTP 400 + a `detail` object
    // carrying the real status + error. Surface it as a result so the UI can
    // show the terminal state + reason instead of a generic 502.
    const failed = detailAsResult(body);
    if (failed) return failed;
    assertOk(res, body); // genuine upstream error → 502
  }
  return (body as MuApiResultResponse) ?? {};
}