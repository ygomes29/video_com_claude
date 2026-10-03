/**
 * Browser-side client for the Content Studio clipping API.
 *
 * Talks ONLY to our own /api/clips/* routes (never to MuAPI directly).
 * Unwraps the shared { type: "success" | "error" } envelope used across
 * the app's route handlers.
 */

import type {
  ClipJobStatus,
  ClipResultsResponse,
  CreateClipRequest,
  CreateClipResponse,
} from "./types";

interface ApiEnvelope<T> {
  type: "success" | "error";
  data?: T;
  message?: string;
}

export class ClipsApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClipsApiError";
  }
}

async function unwrap<T>(res: Response): Promise<T> {
  let json: ApiEnvelope<T>;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new ClipsApiError(`Resposta inválida do servidor (HTTP ${res.status}).`);
  }
  if (json.type === "success" && json.data !== undefined) return json.data;
  throw new ClipsApiError(json.message ?? "Erro desconhecido ao processar cortes.");
}

export async function createClipJob(
  body: CreateClipRequest,
): Promise<CreateClipResponse> {
  const res = await fetch("/api/clips/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return unwrap<CreateClipResponse>(res);
}

export async function getClipStatus(jobId: string): Promise<ClipJobStatus> {
  const res = await fetch(
    `/api/clips/status?jobId=${encodeURIComponent(jobId)}`,
    { method: "GET" },
  );
  return unwrap<ClipJobStatus>(res);
}

export async function getClipResults(
  jobId: string,
): Promise<ClipResultsResponse> {
  const res = await fetch(
    `/api/clips/results?jobId=${encodeURIComponent(jobId)}`,
    { method: "GET" },
  );
  return unwrap<ClipResultsResponse>(res);
}

/** Presigned upload grant returned by /api/clips/upload-url. */
export interface UploadUrlGrant {
  key: string;
  uploadUrl: string;
  videoUrl: string;
}

/**
 * Ask the server for presigned S3 URLs to upload a local file. Returns the
 * PUT URL (browser → S3) and the GET URL (time-limited, used as the video
 * URL fed to /api/clips/create).
 */
export async function requestUploadUrl(input: {
  contentType: string;
  size: number;
}): Promise<UploadUrlGrant> {
  const res = await fetch("/api/clips/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return unwrap<UploadUrlGrant>(res);
}

/**
 * Upload a File directly to S3 via a presigned PUT URL, reporting progress
 * as a 0..1 fraction. Uses XHR because fetch has no upload-progress event.
 * Rejects with ClipsApiError on any non-2xx response or network failure.
 */
export function uploadFileToS3(
  file: File,
  uploadUrl: string,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new ClipsApiError(`Upload falhou (HTTP ${xhr.status}).`));
    };
    xhr.onerror = () =>
      reject(new ClipsApiError("Erro de rede no upload para o S3."));
    xhr.onabort = () => reject(new ClipsApiError("Upload cancelado."));
    xhr.send(file);
  });
}