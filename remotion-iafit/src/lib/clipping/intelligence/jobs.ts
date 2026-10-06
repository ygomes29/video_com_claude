/**
 * Local dogfooding job store. NOT safe for serverless/production async execution.
 *
 * State lives in a process-local Map. It does NOT survive restarts/redeploys,
 * does NOT scale across instances, and the fire-and-forget `runPipeline` that
 * populates it runs only while the `next dev` process is alive. This is an
 * explicit V1 trade-off for local dogfooding. Production migration:
 *   job store → Supabase (or S3 JSON), worker → separate process/queue,
 *   render → Remotion Lambda. See the plan's "Limitations" section.
 */

import { randomUUID } from "node:crypto";
import type { AspectRatio, Clip, ClipJobStage, ClipStatus } from "../types";

export interface JobRecord {
  id: string;
  status: ClipStatus;
  stage: ClipJobStage;
  message?: string;
  videoUrl: string;
  aspectRatio: AspectRatio;
  highlights: Clip[];
  createdAt: number;
}

export interface CreateJobInput {
  videoUrl: string;
  aspectRatio: AspectRatio;
}

/** Process-local store. Pruned lazily on each access to bound memory. */
const jobs = new Map<string, JobRecord>();

const JOB_TTL_MS = 60 * 60 * 1000; // 1 hour

function pruneOldJobs(): void {
  const cutoff = Date.now() - JOB_TTL_MS;
  // forEach (not for...of) so this type-checks under target es5 without
  // downlevelIteration.
  jobs.forEach((job, id) => {
    if (job.createdAt < cutoff) jobs.delete(id);
  });
}

export function createJob(input: CreateJobInput): JobRecord {
  pruneOldJobs();
  const job: JobRecord = {
    id: randomUUID(),
    status: "queued",
    stage: "transcrevendo",
    videoUrl: input.videoUrl,
    aspectRatio: input.aspectRatio,
    highlights: [],
    createdAt: Date.now(),
  };
  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): JobRecord | undefined {
  pruneOldJobs();
  return jobs.get(id);
}

export function updateJob(id: string, patch: Partial<JobRecord>): void {
  const job = jobs.get(id);
  if (!job) return;
  jobs.set(id, { ...job, ...patch });
}

/** Test-only: clear the store between cases. */
export function __resetJobsForTest(): void {
  jobs.clear();
}