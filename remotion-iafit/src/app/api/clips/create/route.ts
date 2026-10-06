import { NextResponse } from "next/server";
import { z } from "zod";
import { clipErrorResponse } from "../../../../lib/clipping/route-helpers";
import { createJob } from "../../../../lib/clipping/intelligence/jobs";
import {
  assertIntelligenceConfigured,
  runPipeline,
} from "../../../../lib/clipping/intelligence/pipeline";
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
 *
 * Creates an in-memory Intelligence job and fires the pipeline
 * (transcribe → LLM select → render) as a background promise. Returns the
 * job id immediately so the client can poll /api/clips/status with it.
 *
 * Status codes:
 *   400 — invalid input (bad URL, numHighlights out of range, bad aspectRatio)
 *   503 — DEEPGRAM_API_KEY / OPENROUTER_API_KEY / bucket not configured
 *   500 — unexpected internal error
 *
 * Local Intelligence Runner — V1 dogfooding only (see pipeline.ts).
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
    assertIntelligenceConfigured();
  } catch (err) {
    return clipErrorResponse(err);
  }

  const job = createJob({
    videoUrl: parsed.data.videoUrl,
    aspectRatio: parsed.data.aspectRatio,
  });

  // Fire-and-forget: runs in the `next dev` process. Never awaited — the
  // client polls /api/clips/status. Local dogfooding only.
  void runPipeline(job.id, {
    videoUrl: parsed.data.videoUrl,
    numHighlights: parsed.data.numHighlights,
    aspectRatio: parsed.data.aspectRatio,
  }).catch((err) => {
    // runPipeline captures its own errors into the job record, but guard
    // against an unexpected throw escaping the handler.
    // eslint-disable-next-line no-console
    console.error(`[intelligence] runPipeline threw for job ${job.id}:`, err);
  });

  const data: CreateClipResponse = {
    jobId: job.id,
    status: "queued",
  };
  return NextResponse.json({ type: "success", data });
}