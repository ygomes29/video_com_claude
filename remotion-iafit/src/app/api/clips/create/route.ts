import { NextResponse } from "next/server";
import { z } from "zod";
import { submitClipJob } from "../../../../lib/clipping/muapi-client";
import { clipErrorResponse } from "../../../../lib/clipping/route-helpers";
import { normalizeClipStatus } from "../../../../lib/clipping/polling";
import type { CreateClipResponse } from "../../../../lib/clipping/types";

export const CreateClipSchema = z.object({
  videoUrl: z
    .string()
    .trim()
    .url("URL do vídeo inválida.")
    .refine((u) => u.startsWith("http://") || u.startsWith("https://"), {
      message: "A URL deve ser http(s).",
    }),
  numHighlights: z.number().int().min(1).max(15).default(5),
  aspectRatio: z.enum(["9:16", "1:1", "4:5"]).default("9:16"),
  returnCoordinatesOnly: z.boolean().optional().default(false),
});

/**
 * POST /api/clips/create
 * Stateless: validates input (400 on bad input), submits to MuAPI, returns
 * the MuAPI request_id as `jobId`. The client polls /api/clips/status with it.
 *
 * Status codes:
 *   400 — invalid input (bad URL, numHighlights out of range, bad aspectRatio)
 *   503 — MUAPI_API_KEY not configured
 *   502 — upstream MuAPI failure
 *   500 — unexpected internal error
 */
export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { type: "error", message: "Corpo da requisição inválido (JSON esperado)." },
      { status: 400 },
    );
  }

  const parsed = CreateClipSchema.safeParse(payload);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Entrada inválida.";
    return NextResponse.json({ type: "error", message }, { status: 400 });
  }

  try {
    const submission = await submitClipJob({
      videoUrl: parsed.data.videoUrl,
      numHighlights: parsed.data.numHighlights,
      aspectRatio: parsed.data.aspectRatio,
      returnCoordinatesOnly: parsed.data.returnCoordinatesOnly,
    });
    const data: CreateClipResponse = {
      jobId: submission.request_id,
      status: normalizeClipStatus(submission.status ?? "queued"),
    };
    return NextResponse.json({ type: "success", data });
  } catch (err) {
    return clipErrorResponse(err);
  }
}