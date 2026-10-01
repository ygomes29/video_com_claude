import { z } from "zod";
import { executeApi } from "../../../helpers/api-response";
import { submitClipJob } from "../../../../lib/clipping/muapi-client";
import { normalizeClipStatus } from "../../../../lib/clipping/polling";
import type { CreateClipResponse } from "../../../../lib/clipping/types";

const CreateClipSchema = z.object({
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
 * Stateless: validates input, submits to MuAPI, returns the MuAPI
 * request_id as `jobId`. The client polls /api/clips/status with it.
 */
export const POST = executeApi<CreateClipResponse, typeof CreateClipSchema>(
  CreateClipSchema,
  async (_req, body) => {
    const submission = await submitClipJob({
      videoUrl: body.videoUrl,
      numHighlights: body.numHighlights,
      aspectRatio: body.aspectRatio,
      returnCoordinatesOnly: body.returnCoordinatesOnly,
    });
    return {
      jobId: submission.request_id,
      status: normalizeClipStatus(submission.status ?? "queued"),
    };
  },
);

/** Re-exported for tests / schema introspection. */
export { CreateClipSchema };