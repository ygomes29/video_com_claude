import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as statusGET } from "../status/route";
import {
  __resetJobsForTest,
  createJob,
  updateJob,
} from "../../../../lib/clipping/intelligence/jobs";

function statusRequest(jobId: string): Promise<Response> {
  return statusGET(new Request(`http://localhost/api/clips/status?jobId=${jobId}`));
}

async function readEnvelope(res: Response): Promise<{
  type: string;
  data?: { jobId: string; status: string; stage: string; message?: string };
  message?: string;
}> {
  return (await res.json()) as {
    type: string;
    data?: { jobId: string; status: string; stage: string; message?: string };
    message?: string;
  };
}

describe("GET /api/clips/status", () => {
  beforeEach(() => __resetJobsForTest());
  afterEach(() => __resetJobsForTest());

  it("returns 400 when jobId is missing", async () => {
    const res = await statusGET(
      new Request("http://localhost/api/clips/status"),
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown job", async () => {
    const res = await statusRequest("nope");
    expect(res.status).toBe(404);
    expect((await readEnvelope(res)).message).toMatch(/Job não encontrado/);
  });

  it("returns the real stage for a fresh job (transcrevendo)", async () => {
    const job = createJob({ videoUrl: "https://example.com/v.mp4", aspectRatio: "9:16" });
    const res = await statusRequest(job.id);
    expect(res.status).toBe(200);
    const env = await readEnvelope(res);
    expect(env.data.status).toBe("queued");
    expect(env.data.stage).toMatch(/Transcrevendo/i);
  });

  it("reflects stage + message updates as the pipeline progresses", async () => {
    const job = createJob({ videoUrl: "https://example.com/v.mp4", aspectRatio: "9:16" });
    updateJob(job.id, { status: "processing", stage: "gerando" });
    const res = await statusRequest(job.id);
    const env = await readEnvelope(res);
    expect(env.data.status).toBe("processing");
    expect(env.data.stage).toMatch(/Gerando cortes/i);
  });

  it("surfaces the failure message when a job failed", async () => {
    const job = createJob({ videoUrl: "https://example.com/v.mp4", aspectRatio: "9:16" });
    updateJob(job.id, {
      status: "failed",
      stage: "transcrevendo",
      message: "Deepgram request failed with HTTP 401",
    });
    const res = await statusRequest(job.id);
    const env = await readEnvelope(res);
    expect(env.data.status).toBe("failed");
    expect(env.data.message).toMatch(/Deepgram/);
  });
});