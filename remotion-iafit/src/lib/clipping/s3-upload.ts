/**
 * S3 presigned upload grant for the Cortes module.
 *
 * SERVER-ONLY. Reads AWS credentials from the environment and must never
 * reach the browser. The browser uploads the MP4 directly to S3 via the
 * presigned PUT URL this module issues; the presigned GET URL is the
 * time-limited, private URL we hand to MuAPI as the `video_url`.
 *
 * Credentials + region reuse the same REMOTION_AWS_* env vars as the
 * Remotion Lambda render path (us-east-1). The bucket is dedicated and
 * private — set CLIPS_UPLOAD_BUCKET.
 */

import "server-only";

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/** Content types accepted for upload. */
const ALLOWED_CONTENT_TYPES = new Set(["video/mp4", "video/quicktime"]);

const CONTENT_TYPE_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

/** Default 1 GiB max upload size; override with CLIPS_UPLOAD_MAX_BYTES. */
const DEFAULT_MAX_BYTES = 1024 * 1024 * 1024;

/** Presigned PUT validity — long enough for a large upload to complete. */
const PUT_EXPIRY_SECONDS = 600;

/** Presigned GET validity — window for the user to hit "Analisar" + MuAPI download. */
const DEFAULT_GET_EXPIRY_SECONDS = 6 * 60 * 60;

export class UploadError extends Error {
  readonly kind: "config" | "aws" | "client";
  constructor(kind: "config" | "aws" | "client", message: string) {
    super(message);
    this.name = "UploadError";
    this.kind = kind;
  }
}

export interface UploadRequestInput {
  contentType: string;
  size: number;
}

export interface UploadGrant {
  /** Object key within the bucket, e.g. uploads/<uuid>.mp4. */
  key: string;
  /** Presigned PUT URL the browser uses to upload the file directly to S3. */
  uploadUrl: string;
  /** Presigned GET URL (time-limited) handed to MuAPI as the video URL. */
  videoUrl: string;
}

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

function resolveRegion(): string {
  return (
    getEnv("CLIPS_UPLOAD_REGION") ??
    getEnv("REMOTION_AWS_REGION") ??
    getEnv("AWS_REGION") ??
    "us-east-1"
  );
}

function resolveMaxBytes(): number {
  const raw = getEnv("CLIPS_UPLOAD_MAX_BYTES");
  if (!raw) return DEFAULT_MAX_BYTES;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_BYTES;
}

function resolveGetExpiry(): number {
  const raw = getEnv("CLIPS_UPLOAD_GET_EXPIRY_SECONDS");
  if (!raw) return DEFAULT_GET_EXPIRY_SECONDS;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_GET_EXPIRY_SECONDS;
}

interface UploadCreds {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}

/**
 * Reads + validates AWS creds + bucket. Throws UploadError("config", ...)
 * — surfaced as 503 by the route — if anything is missing.
 */
function requireUploadCreds(): UploadCreds {
  const accessKeyId =
    getEnv("REMOTION_AWS_ACCESS_KEY_ID") ?? getEnv("AWS_ACCESS_KEY_ID");
  const secretAccessKey =
    getEnv("REMOTION_AWS_SECRET_ACCESS_KEY") ?? getEnv("AWS_SECRET_ACCESS_KEY");
  const bucket = getEnv("CLIPS_UPLOAD_BUCKET");
  const missing: string[] = [];
  if (!accessKeyId)
    missing.push("REMOTION_AWS_ACCESS_KEY_ID (or AWS_ACCESS_KEY_ID)");
  if (!secretAccessKey)
    missing.push("REMOTION_AWS_SECRET_ACCESS_KEY (or AWS_SECRET_ACCESS_KEY)");
  if (!bucket) missing.push("CLIPS_UPLOAD_BUCKET");
  if (missing.length > 0) {
    throw new UploadError(
      "config",
      `Upload não configurado. Variáveis ausentes: ${missing.join(", ")}.`,
    );
  }
  return {
    accessKeyId: accessKeyId as string,
    secretAccessKey: secretAccessKey as string,
    region: resolveRegion(),
    bucket: bucket as string,
  };
}

// The client is stateless + env-driven; cache one per process.
let cachedClient: S3Client | null = null;

function s3Client(creds: UploadCreds): S3Client {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: creds.region,
      credentials: {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
      },
    });
  }
  return cachedClient;
}

/** Test-only: drop the cached client so env changes between cases take effect. */
export function __resetUploadClientForTest(): void {
  cachedClient = null;
}

/**
 * Validate input + issue presigned PUT + GET URLs for a browser-direct upload.
 *
 * The PUT URL expires in ~10 min (enough to finish a large upload); the GET
 * URL expires in ~6h (configurable) so the user has time to hit "Analisar"
 * and MuAPI has time to download the object.
 */
export async function createUploadRequest(
  input: UploadRequestInput,
): Promise<UploadGrant> {
  const contentType = (input.contentType ?? "").trim().toLowerCase();
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new UploadError(
      "client",
      `Tipo de arquivo não suportado: "${input.contentType}". Use MP4 ou MOV.`,
    );
  }
  const maxBytes = resolveMaxBytes();
  if (!Number.isFinite(input.size) || input.size <= 0) {
    throw new UploadError("client", "Tamanho de arquivo inválido.");
  }
  if (input.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    throw new UploadError("client", `Arquivo muito grande (máximo ${mb} MB).`);
  }

  const creds = requireUploadCreds();
  const ext = CONTENT_TYPE_EXT[contentType] ?? "mp4";
  const key = `uploads/${randomUUID()}.${ext}`;
  const client = s3Client(creds);

  try {
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: creds.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: PUT_EXPIRY_SECONDS },
    );
    const videoUrl = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: creds.bucket, Key: key }),
      { expiresIn: resolveGetExpiry() },
    );
    return { key, uploadUrl, videoUrl };
  } catch (err) {
    throw new UploadError(
      "aws",
      `Falha ao gerar URL de upload: ${(err as Error).message}`,
    );
  }
}

/**
 * Upload a locally-rendered clip MP4 to the same private bucket and return a
 * presigned GET URL (time-limited) used as the clip's `clipUrl`.
 *
 * Used by the Intelligence render step: `renderMedia` writes to /tmp, this
 * uploads the file under `clips-output/<uuid>.mp4` and hands back a URL the
 * browser can play. Reuses the same S3Client / creds / region as uploads.
 */
export async function uploadClipOutput(
  filePath: string,
  contentType = "video/mp4",
): Promise<string> {
  const creds = requireUploadCreds();
  const client = s3Client(creds);
  const ext = contentType === "video/quicktime" ? "mov" : "mp4";
  const key = `clips-output/${randomUUID()}.${ext}`;
  let body: Buffer;
  try {
    body = await readFile(filePath);
  } catch (err) {
    throw new UploadError(
      "aws",
      `Falha ao ler clip renderizado: ${(err as Error).message}`,
    );
  }
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: creds.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: creds.bucket, Key: key }),
      { expiresIn: resolveGetExpiry() },
    );
  } catch (err) {
    throw new UploadError(
      "aws",
      `Falha ao enviar clip renderizado ao S3: ${(err as Error).message}`,
    );
  }
}