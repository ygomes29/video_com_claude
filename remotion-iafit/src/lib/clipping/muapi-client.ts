/**
 * MuAPI HTTP transport client.
 *
 * SERVER-ONLY. Never import this from a client component — it reads
 * MUAPI_API_KEY from the environment and must never reach the browser.
 *
 * This module is intentionally thin: it only speaks the raw MuAPI schema.
 * Domain normalization (raw → Clip[]) lives in `highlights.ts`.
 *
 * Reference: https://muapi.ai/docs/api-reference
 *   POST {BASE}/ai-clipping                       → { request_id, status, cost }
 *   GET  {BASE}/predictions/{request_id}/result   → { id, status, outputs, ... }
 *   statuses: queued | pending | processing | completed | failed | cancelled
 */

import type { AspectRatio, ClipStatus } from "./types";
import { normalizeClipStatus } from "./polling";

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
  const message =
    typeof body === "object" && body !== null && "message" in body
      ? String((body as { message: unknown }).message)
      : `MuAPI request failed with HTTP ${res.status}`;
  throw new MuApiError(message, { status: res.status, body });
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

/** Fetch the raw result object for a job. Works for both status + result. */
export async function getJobResult(
  requestId: string,
): Promise<MuApiResultResponse> {
  if (!requestId) throw new MuApiError("Missing jobId (request_id).");
  const url = `${getBaseUrl()}/predictions/${encodeURIComponent(requestId)}/result`;
  const res = await fetchWithRetry(url, { method: "GET", headers: authHeaders() });
  const body = (await parseJson(res)) as MuApiResultResponse | null;
  assertOk(res, body);
  return body ?? {};
}

/** Convenience: just the normalized status for a job. */
export async function getJobStatus(requestId: string): Promise<ClipStatus> {
  const result = await getJobResult(requestId);
  return normalizeClipStatus(result.status);
}