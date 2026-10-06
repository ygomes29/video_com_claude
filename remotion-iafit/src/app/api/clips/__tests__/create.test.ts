import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IntelligenceError } from "../../../../lib/clipping/intelligence/errors";
import { __resetJobsForTest } from "../../../../lib/clipping/intelligence/jobs";

// Mock the pipeline module so the route never hits Deepgram/OpenRouter/Remotion.
vi.mock("../../../../lib/clipping/intelligence/pipeline", () => ({
  runPipeline: vi.fn(),
  assertIntelligenceConfigured: vi.fn(),
}));

import { assertIntelligenceConfigured, runPipeline } from "../../../../lib/clipping/intelligence/pipeline";
import { CreateClipSchema, POST } from "../create/route";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/clips/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function readEnvelope(
  res: Response,
): Promise<{ type: string; data?: unknown; message?: string }> {
  return (await res.json()) as { type: string; data?: unknown; message?: string };
}

describe("POST /api/clips/create (schema validation)", () => {
  it("applies defaults for optional fields", () => {
    const parsed = CreateClipSchema.parse({ videoUrl: "https://example.com/v.mp4" });
    expect(parsed.numHighlights).toBe(5);
    expect(parsed.aspectRatio).toBe("9:16");
    expect(parsed.returnCoordinatesOnly).toBe(false);
  });

  it("rejects an invalid URL at the schema layer", () => {
    expect(() => CreateClipSchema.parse({ videoUrl: "not-a-url" })).toThrow();
    expect(() => CreateClipSchema.parse({ videoUrl: "ftp://x" })).toThrow();
  });

  it("rejects numHighlights out of range", () => {
    expect(() =>
      CreateClipSchema.parse({ videoUrl: "https://example.com/v.mp4", numHighlights: 0 }),
    ).toThrow();
    expect(() =>
      CreateClipSchema.parse({ videoUrl: "https://example.com/v.mp4", numHighlights: 16 }),
    ).toThrow();
  });

  it("rejects an invalid aspectRatio", () => {
    expect(() =>
      CreateClipSchema.parse({ videoUrl: "https://example.com/v.mp4", aspectRatio: "16:9" }),
    ).toThrow();
  });
});

describe("POST /api/clips/create (route handler)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetJobsForTest();
    vi.mocked(assertIntelligenceConfigured).mockImplementation(() => {
      /* configured by default */
    });
    vi.mocked(runPipeline).mockResolvedValue(undefined);
  });

  afterEach(() => {
    __resetJobsForTest();
  });

  it("returns 400 for an invalid URL", async () => {
    const res = await POST(postRequest({ videoUrl: "not-a-url" }));
    expect(res.status).toBe(400);
    const env = await readEnvelope(res);
    expect(env.type).toBe("error");
    expect(env.message).toMatch(/URL/i);
  });

  it("returns 400 for numHighlights out of range", async () => {
    const res = await POST(
      postRequest({ videoUrl: "https://example.com/v.mp4", numHighlights: 99 }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid aspectRatio", async () => {
    const res = await POST(
      postRequest({ videoUrl: "https://example.com/v.mp4", aspectRatio: "16:9" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for a non-JSON body", async () => {
    const res = await POST(
      new Request("http://localhost/api/clips/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }),
    );
    expect(res.status).toBe(400);
  });

  // Missing Intelligence keys → assertIntelligenceConfigured throws config → 503.
  it("returns 503 when DEEPGRAM_API_KEY is missing", async () => {
    vi.mocked(assertIntelligenceConfigured).mockImplementation(() => {
      throw new IntelligenceError(
        "config",
        "DEEPGRAM_API_KEY is not configured. Add it to the server environment.",
      );
    });
    const res = await POST(
      postRequest({ videoUrl: "https://example.com/v.mp4", numHighlights: 3 }),
    );
    expect(res.status).toBe(503);
    const env = await readEnvelope(res);
    expect(env.message).toMatch(/DEEPGRAM_API_KEY/);
  });

  it("returns 503 when OPENROUTER_API_KEY is missing", async () => {
    vi.mocked(assertIntelligenceConfigured).mockImplementation(() => {
      throw new IntelligenceError("config", "OPENROUTER_API_KEY is not configured.");
    });
    const res = await POST(
      postRequest({ videoUrl: "https://example.com/v.mp4", numHighlights: 3 }),
    );
    expect(res.status).toBe(503);
    expect((await readEnvelope(res)).message).toMatch(/OPENROUTER_API_KEY/);
  });

  it("returns jobId (UUID) + status queued and fires runPipeline", async () => {
    const res = await POST(
      postRequest({
        videoUrl: "https://example.com/v.mp4",
        numHighlights: 3,
        aspectRatio: "9:16",
      }),
    );
    expect(res.status).toBe(200);
    const env = await readEnvelope(res);
    expect(env.type).toBe("success");
    const data = env.data as { jobId: string; status: string };
    expect(data.status).toBe("queued");
    expect(typeof data.jobId).toBe("string");
    expect(data.jobId.length).toBeGreaterThan(0);
    // runPipeline fired once with the parsed input + the returned jobId.
    expect(runPipeline).toHaveBeenCalledTimes(1);
    const [jobId, input] = vi.mocked(runPipeline).mock.calls[0];
    expect(jobId).toBe(data.jobId);
    expect(input).toEqual({
      videoUrl: "https://example.com/v.mp4",
      numHighlights: 3,
      aspectRatio: "9:16",
    });
  });

  it("does not await runPipeline (returns before it resolves)", async () => {
    let resolvePipeline: () => void = () => {};
    vi.mocked(runPipeline).mockImplementation(
      () => new Promise<void>((resolve) => (resolvePipeline = resolve)),
    );
    const res = await POST(
      postRequest({ videoUrl: "https://example.com/v.mp4", numHighlights: 2 }),
    );
    expect(res.status).toBe(200); // returned without waiting for runPipeline
    resolvePipeline();
  });
});