import { NextResponse } from "next/server";
import { z } from "zod";
import { getJob } from "../../../../lib/clipping/intelligence/jobs";
import type { ClipResultsResponse } from "../../../../lib/clipping/types";

const ResultsQuerySchema = z.object({
  jobId: z.string().trim().min(1, "jobId é obrigatório."),
});

/**
 * GET /api/clips/results?jobId=...
 * Reads the in-memory Intelligence job and returns its highlights as Clip[].
 * Returns whatever highlights have been produced so far (including partial
 * results when a later render step failed). Local dogfooding only.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = ResultsQuerySchema.safeParse({
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

  const payload: ClipResultsResponse = {
    jobId: job.id,
    status: job.status,
    clips: job.highlights,
  };
  return NextResponse.json({ type: "success", data: payload });
}