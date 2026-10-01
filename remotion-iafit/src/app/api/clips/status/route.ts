import { NextResponse } from "next/server";
import { z } from "zod";
import { getJobResult } from "../../../../lib/clipping/muapi-client";
import { clipErrorResponse } from "../../../../lib/clipping/route-helpers";
import {
  normalizeClipStatus,
  statusToStageLabel,
} from "../../../../lib/clipping/polling";
import type { ClipJobStatus } from "../../../../lib/clipping/types";

const StatusQuerySchema = z.object({
  jobId: z.string().trim().min(1, "jobId é obrigatório."),
});

/**
 * GET /api/clips/status?jobId=...
 * Stateless: queries MuAPI live, returns a normalized status + a
 * representational stage label for the UI.
 */
export async function GET(req: Request) {
  try {
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

    const result = await getJobResult(parsed.data.jobId);
    const status = normalizeClipStatus(result.status);

    const payload: ClipJobStatus = {
      jobId: parsed.data.jobId,
      status,
      stage: statusToStageLabel(status),
      message:
        status === "failed"
          ? (result.error ?? result.message ?? "O processamento falhou.")
          : undefined,
    };
    return NextResponse.json({ type: "success", data: payload });
  } catch (err) {
    return clipErrorResponse(err);
  }
}