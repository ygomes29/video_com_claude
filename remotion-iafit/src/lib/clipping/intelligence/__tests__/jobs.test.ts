import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetJobsForTest,
  createJob,
  getJob,
  updateJob,
} from "../jobs";

describe("intelligence jobs store", () => {
  beforeEach(() => __resetJobsForTest());
  afterEach(() => __resetJobsForTest());

  it("creates a job with queued status + transcrevendo stage", () => {
    const job = createJob({ videoUrl: "https://example.com/v.mp4", aspectRatio: "9:16" });
    expect(job.status).toBe("queued");
    expect(job.stage).toBe("transcrevendo");
    expect(job.highlights).toEqual([]);
    expect(job.id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("getJob returns the created job", () => {
    const job = createJob({ videoUrl: "https://example.com/v.mp4", aspectRatio: "9:16" });
    expect(getJob(job.id)?.id).toBe(job.id);
  });

  it("getJob returns undefined for unknown id", () => {
    expect(getJob("nope")).toBeUndefined();
  });

  it("updateJob merges a patch", () => {
    const job = createJob({ videoUrl: "https://example.com/v.mp4", aspectRatio: "9:16" });
    updateJob(job.id, { status: "processing", stage: "gerando" });
    expect(getJob(job.id)?.status).toBe("processing");
    expect(getJob(job.id)?.stage).toBe("gerando");
  });

  it("updateJob is a no-op for unknown id", () => {
    expect(() => updateJob("nope", { status: "failed" })).not.toThrow();
  });

  it("prunes jobs older than 1 hour", () => {
    const job = createJob({ videoUrl: "https://example.com/v.mp4", aspectRatio: "9:16" });
    // Backdate createdAt beyond TTL.
    vi.useFakeTimers();
    const now = Date.now();
    // Mutate the record directly via updateJob to set an old createdAt.
    updateJob(job.id, { createdAt: now - 2 * 60 * 60 * 1000 } as never);
    // A new create triggers pruneOldJobs, which removes the backdated job.
    createJob({ videoUrl: "https://example.com/v2.mp4", aspectRatio: "9:16" });
    expect(getJob(job.id)).toBeUndefined();
    vi.useRealTimers();
  });
});