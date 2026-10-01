/**
 * Normalization layer: raw MuAPI responses → internal Clip[].
 *
 * Components never touch the MuAPI schema directly. This module defends
 * against the documented `shorts[]` shape AND the generic `outputs[]`
 * envelope, and tolerates unexpected JSON (missing fields, string-only
 * outputs, etc.) so a malformed response degrades gracefully instead of
 * crashing the UI.
 */

import type { MuApiResultResponse, MuApiShort } from "./muapi-client";
import { normalizeClipStatus } from "./polling";
import type { Clip, ClipStatus } from "./types";

/** Safely read a number from an unknown value. */
function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

/** Safely read a string from an unknown value. */
function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

function firstString(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
  }
  return "";
}

/** Clamp a score to 0–100. */
function clampScore(n: number): number {
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}

/** Stable-ish id within a result set (jobId + index). */
function makeClipId(jobId: string, index: number): string {
  return `${jobId}-${index}`;
}

/** Normalize a single raw short into a Clip. */
function normalizeShort(
  raw: MuApiShort,
  jobId: string,
  index: number,
  fallbackStatus: ClipStatus,
): Clip {
  const startTime = asNumber(raw.start_time, 0);
  const endTime = asNumber(raw.end_time, startTime);
  const duration = Math.max(0, endTime - startTime);
  const clipUrl = firstString(raw.clip_url, raw.url);
  // Score is null when the provider returns none (the real ai-clipping
  // endpoint only yields clip URLs in `outputs` — no score). A present-but-
  // invalid value (e.g. "not-a-number") still falls back to 0.
  const viralScore =
    raw.score == null ? null : clampScore(asNumber(raw.score, 0));
  return {
    id: makeClipId(jobId, index),
    title: firstString(raw.title, raw.hook_sentence, raw.hook) || `Corte ${index + 1}`,
    hook: firstString(raw.hook_sentence, raw.hook),
    startTime,
    endTime,
    duration,
    transcript: asString(raw.transcript) || undefined,
    viralScore,
    iafitScore: null,
    viralityReason: firstString(raw.virality_reason, raw.reason),
    categories: [],
    clipUrl,
    thumbnailUrl: firstString(raw.thumbnail, raw.thumbnail_url) || undefined,
    status: fallbackStatus,
  };
}

/**
 * Extract a MuApiShort[] from either the specialized `shorts` field or the
 * generic `outputs` field (which may be an array of objects or URLs).
 */
function extractShorts(result: MuApiResultResponse): MuApiShort[] {
  if (Array.isArray(result.shorts) && result.shorts.length > 0) {
    return result.shorts;
  }
  if (Array.isArray(result.outputs)) {
    return result.outputs.map((item) => {
      if (item && typeof item === "object") return item as MuApiShort;
      // Generic envelope: outputs is a list of URLs.
      return { clip_url: asString(item) } as MuApiShort;
    });
  }
  if (result.outputs && typeof result.outputs === "object") {
    // outputs as a map: best-effort, look for a shorts-like array value.
    for (const value of Object.values(result.outputs)) {
      if (Array.isArray(value)) return value as MuApiShort[];
    }
  }
  return [];
}

/**
 * Normalize a full MuAPI result into a Clip[].
 * Returns an empty array (not a throw) when no shorts are present —
 * the caller decides how to surface "no clips found".
 */
export function normalizeShorts(
  result: MuApiResultResponse,
  jobId: string,
): Clip[] {
  const status = normalizeClipStatus(result.status);
  const shorts = extractShorts(result);
  return shorts.map((s, i) => normalizeShort(s, jobId, i, status));
}