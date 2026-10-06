import { NextResponse } from "next/server";
import { MuApiError } from "./muapi-client";
import { IntelligenceError } from "./intelligence/errors";

/**
 * Map a clipping-layer error to an appropriate HTTP error envelope.
 *
 * Used by the /api/clips/* route handlers so status codes are consistent:
 *   - missing MUAPI_API_KEY / Intelligence keys → 503 (service misconfigured)
 *   - upstream MuAPI / Deepgram / OpenRouter failure → 502 (bad gateway)
 *   - Intelligence client-side bad input            → 400
 *   - anything else                                 → 500 (unexpected)
 *
 * Input-validation (400) errors are handled by the caller via Zod
 * `safeParse`, before this helper runs.
 */
export function clipErrorResponse(err: unknown): Response {
  if (err instanceof IntelligenceError) {
    const status =
      err.kind === "config"
        ? 503
        : err.kind === "upstream"
          ? 502
          : 400;
    return NextResponse.json(
      { type: "error", message: err.message },
      { status },
    );
  }
  if (err instanceof MuApiError) {
    // No HTTP status ⇒ local configuration / protocol error from our client.
    // The missing-API-key case is the one we want to surface as 503.
    if (err.status === undefined && /MUAPI_API_KEY/i.test(err.message)) {
      return NextResponse.json(
        { type: "error", message: err.message },
        { status: 503 },
      );
    }
    // An HTTP status from MuAPI (4xx/5xx) or a malformed upstream body
    // ⇒ 502 Bad Gateway.
    return NextResponse.json(
      { type: "error", message: err.message },
      { status: 502 },
    );
  }
  return NextResponse.json(
    { type: "error", message: (err as Error).message },
    { status: 500 },
  );
}