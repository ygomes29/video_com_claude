import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as resultsGET } from "../results/route";
import {
  __resetJobsForTest,
  createJob,
  updateJob,
} from "../../../../lib/clipping/intelligence/jobs";
import type { Clip } from "../../../../lib/clipping/types";

function resultsRequest(jobId: string): Promise<Response> {
  return resultsGET(new Request(`http://localhost/api/clips/results?jobId=${jobId}`));
}

async function readEnvelope(res: Response): Promise<{
  type: string;
  data?: { jobId: string; status: string; clips: Clip[] };
  message?: string;
}> {
  return (await res.json()) as {
    type: string;
    data?: { jobId: string; status: string; clips: Clip[] };
    message?: string;
  };
}

function makeClip(over: Partial<Clip> = {}): Clip {
  return {
    id: "clip-1",
    title: "Título",
    hook: "hook",
    startTime: 10,
    endTime: 40,
    duration: 30,
    transcript: "verbatim",
    viralScore: 80,
    iafitScore: 70,
    viralityReason: "razão viral",
    iafitReason: "razão iafit",
    categories: ["DOR_DO_CLIENTE"],
    clipUrl: "https://example.com/clip.mp4",
    status: "completed",
    ...over,
  };
}

describe("GET /api/clips/results", () => {
  beforeEach(() => __resetJobsForTest());
  afterEach(() => __resetJobsForTest());

  it("returns 400 when jobId is missing", async () => {
    const res = await resultsGET(new Request("http://localhost/api/clips/results"));
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown job", async () => {
    const res = await resultsRequest("nope");
    expect(res.status).toBe(404);
  });

  it("returns empty clips for a job that hasn't completed", async () => {
    const job = createJob({ videoUrl: "https://example.com/v.mp4", aspectRatio: "9:16" });
    const res = await resultsRequest(job.id);
    const env = await readEnvelope(res);
    expect(env.data.clips).toEqual([]);
  });

  it("returns completed clips when the job is done", async () => {
    const job = createJob({ videoUrl: "https://example.com/v.mp4", aspectRatio: "9:16" });
    const clip = makeClip();
    updateJob(job.id, { status: "completed", stage: "concluido", highlights: [clip] });
    const res = await resultsRequest(job.id);
    const env = await readEnvelope(res);
    expect(env.data.status).toBe("completed");
    expect(env.data.clips).toHaveLength(1);
    expect(env.data.clips[0].title).toBe("Título");
    expect(env.data.clips[0].viralScore).toBe(80);
    expect(env.data.clips[0].iafitScore).toBe(70);
  });

  it("returns partial clips even when a later render step failed", async () => {
    const job = createJob({ videoUrl: "https://example.com/v.mp4", aspectRatio: "9:16" });
    updateJob(job.id, {
      status: "failed",
      stage: "gerando",
      message: "Render do clip falhou",
      highlights: [makeClip({ id: "clip-1" })],
    });
    const res = await resultsRequest(job.id);
    const env = await readEnvelope(res);
    expect(env.data.status).toBe("failed");
    expect(env.data.clips).toHaveLength(1); // partial result preserved
  });
});