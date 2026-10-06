import { NextResponse } from "next/server";
import { z } from "zod";
import { getJob } from "../../../../lib/clipping/intelligence/jobs";
import type { ClipJobStage, ClipJobStatus } from "../../../../lib/clipping/types";

const StatusQuerySchema = z.object({
  jobId: z.string().trim().min(1, "jobId é obrigatório."),
});

const STAGE_LABELS: Record<ClipJobStage, string> = {
  transcrevendo: "Transcrevendo...",
  identificando: "Identificando melhores momentos...",
  gerando: "Gerando cortes...",
  concluido: "Concluído",
};

/**
 * GET /api/clips/status?jobId=...
 * Reads the in-memory Intelligence job and returns its status + real stage.
 * Local dogfooding only — jobs do not survive restart (see jobs.ts).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = StatusQuerySchema.safeParse({
    jobId: url.searchParams.get("jobId"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { type: "error", message: parsed.error.issues[0]?.message ?? "jobId inválido." },
      { status: 400 },
    );
  }

  const job = getJob(parsed.data.jobId);
  if (!job) {
    return NextResponse.json(
      { type: "error", message: "Job não encontrado." },
      { status: 404 },
    );
  }

  const payload: ClipJobStatus = {
    jobId: job.id,
    status: job.status,
    stage: STAGE_LABELS[job.stage],
    message: job.message,
  };
  return NextResponse.json({ type: "success", data: payload });
}