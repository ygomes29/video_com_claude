import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createUploadRequest,
  UploadError,
  type UploadGrant,
} from "../../../../lib/clipping/s3-upload";

export const UploadUrlSchema = z.object({
  contentType: z.string().trim().min(1, "contentType é obrigatório."),
  size: z.number().int().positive("size deve ser um número de bytes positivo."),
});

/**
 * POST /api/clips/upload-url
 *
 * Returns a presigned PUT URL (browser → S3 direct) and a presigned GET URL
 * (time-limited, private — handed to MuAPI as the video URL). The browser
 * uploads the file straight to S3, bypassing the Next body-size limit, then
 * feeds the GET URL into the existing /api/clips/create flow.
 *
 * Status codes:
 *   400 — invalid input, unsupported content type, or file too large
 *   503 — AWS creds / bucket not configured
 *   502 — AWS error while generating the presigned URL
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

  const parsed = UploadUrlSchema.safeParse(payload);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Entrada inválida.";
    return NextResponse.json({ type: "error", message }, { status: 400 });
  }

  try {
    const grant: UploadGrant = await createUploadRequest({
      contentType: parsed.data.contentType,
      size: parsed.data.size,
    });
    return NextResponse.json({ type: "success", data: grant });
  } catch (err) {
    if (err instanceof UploadError) {
      const status =
        err.kind === "config" ? 503 : err.kind === "aws" ? 502 : 400;
      return NextResponse.json(
        { type: "error", message: err.message },
        { status },
      );
    }
    return NextResponse.json(
      { type: "error", message: (err as Error).message },
      { status: 500 },
    );
  }
}