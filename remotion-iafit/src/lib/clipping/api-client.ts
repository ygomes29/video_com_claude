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