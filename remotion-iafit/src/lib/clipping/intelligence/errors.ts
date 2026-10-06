/**
 * Error type for the IAFIT Intelligence layer.
 *
 * SERVER-ONLY concern (this module is imported only by server-only clients).
 * `kind` drives the HTTP mapping in `route-helpers.ts`:
 *   - "config"   → 503 (missing DEEPGRAM_API_KEY / OPENROUTER_API_KEY / bucket)
 *   - "upstream" → 502 (Deepgram / OpenRouter / S3 returned an error)
 *   - "client"   → 400 (bad input that should never reach the provider)
 */
export class IntelligenceError extends Error {
  readonly kind: "config" | "upstream" | "client";
  readonly status?: number;
  constructor(
    kind: "config" | "upstream" | "client",
    message: string,
    opts?: { status?: number },
  ) {
    super(message);
    this.name = "IntelligenceError";
    this.kind = kind;
    this.status = opts?.status;
  }
}