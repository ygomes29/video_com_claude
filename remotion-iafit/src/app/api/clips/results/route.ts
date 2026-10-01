import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeShorts } from "../../../../lib/clipping/highlights";
import { getJobResult } from "../../../../lib/clipping/muapi-client";
import { clipErrorResponse } from "../../../../lib/clipping/route-helpers";
import { normalizeClipStatus } from "../../../../lib/clipping/polling";
import type { ClipResultsResponse } from "../../../../lib/clipping/types";

const ResultsQuerySchema = z.object({
  jobId: z.string().trim().min(1, "jobId é obrigatório."),
});

/**
 * GET /api/clips/results?jobId=...
 * Stateless: queries MuAPI live, normalizes the completed payload into
 * Clip[]. Returns an empty clips array (with the current status) when the
 * job is not yet completed or no shorts were produced — the client decides
 * how to surface that.
 */
export async function GET(req: Request) {
  try {
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

    const { jobId } = parsed.data;
    const result = await getJobResult(jobId);
    const status = normalizeClipStatus(result.status);

    const payload: ClipResultsResponse = {
      jobId,
      status,
      clips: status === "completed" ? normalizeShorts(result, jobId) : [],
    };
    return NextResponse.json({ type: "success", data: payload });
  } catch (err) {
    return clipErrorResponse(err);
  }
}