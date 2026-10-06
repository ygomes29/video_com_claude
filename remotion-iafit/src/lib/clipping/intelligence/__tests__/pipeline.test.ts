import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Partial mocks: keep resolveSegmentRange real, mock only the I/O functions.
vi.mock("../deepgram-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../deepgram-client")>()),
  transcribeVideo: vi.fn(),
}));
vi.mock("../llm-select", () => ({
  selectHighlights: vi.fn(),
  requireOpenRouterKey: vi.fn(),
}));
vi.mock("../render", () => ({
  renderHighlightToClip: vi.fn(),
}));

import { transcribeVideo, type TranscriptSegment } from "../deepgram-client";
import { selectHighlights, type RawHighlight } from "../llm-select";
import { renderHighlightToClip } from "../render";
import { runPipeline } from "../pipeline";
import {
  __resetJobsForTest,
  createJob,
  getJob,
} from "../jobs";
import type { AspectRatio } from "../../types";

function segments(times: Array<[number, number]>): TranscriptSegment[] {
  return times.map(([start, end], i) => ({
    id: `segment_${String(i + 1).padStart(4, "0")}`,
    start,
    end,
    text: `texto-${i + 1}`,
  }));
}

function raw(over: Partial<RawHighlight> = {}): RawHighlight {
  return {
    title: "Título",
    hook: "hook",
    startSegmentId: "segment_0001",
    endSegmentId: "segment_0002",
    viralScore: 80,
    iafitScore: 70,
    categories: ["DOR_DO_CLIENTE"],
    viralityReason: "razão viral",
    iafitReason: "razão iafit",
    ...over,
  };
}

async function run(input: {
  segments: TranscriptSegment[];
  raws: RawHighlight[];
  renderImpl?: ReturnType<typeof vi.fn>;
}): Promise<ReturnType<typeof getJob>> {
  vi.mocked(transcribeVideo).mockResolvedValue(input.segments);
  vi.mocked(selectHighlights).mockResolvedValue(input.raws);
  vi.mocked(renderHighlightToClip).mockImplementation(
    input.renderImpl ??
      (vi.fn().mockResolvedValue("https://example.com/clip.mp4") as never),
  );
  const job = createJob({
    videoUrl: "https://example.com/v.mp4",
    aspectRatio: "9:16" as AspectRatio,
  });
  await runPipeline(job.id, {
    videoUrl: "https://example.com/v.mp4",
    numHighlights: input.raws.length,
    aspectRatio: "9:16",
  });
  return getJob(job.id);
}

describe("intelligence pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetJobsForTest();
  });
  afterEach(() => __resetJobsForTest());

  it("completes a full happy-path run with derived timestamps + transcript", async () => {
    const segs = segments([
      [0, 5],
      [5, 12],
    ]);
    const job = await run({
      segments: segs,
      raws: [raw({ startSegmentId: "segment_0001", endSegmentId: "segment_0002" })],
    });
    expect(job.status).toBe("completed");
    expect(job.stage).toBe("concluido");
    expect(job.highlights).toHaveLength(1);
    const clip = job.highlights[0];
    expect(clip.startTime).toBe(0);
    expect(clip.endTime).toBe(12);
    expect(clip.duration).toBe(12);
    // Transcript is concatenated verbatim from Deepgram segments, NOT from LLM.
    expect(clip.transcript).toBe("texto-1 texto-2");
    expect(clip.viralScore).toBe(80);
    expect(clip.iafitScore).toBe(70);
    expect(clip.viralityReason).toBe("razão viral");
    expect(clip.iafitReason).toBe("razão iafit");
    expect(clip.categories).toEqual(["DOR_DO_CLIENTE"]);
    expect(clip.clipUrl).toBe("https://example.com/clip.mp4");
  });

  it("derives transcript from Deepgram even when the LLM returns none", async () => {
    // RawHighlight schema has no transcript field; the Clip.transcript must
    // come purely from the Deepgram segments.
    const r = raw();
    expect((r as { transcript?: string }).transcript).toBeUndefined();
    const job = await run({ segments: segments([[0, 5], [5, 10]]), raws: [r] });
    expect(job.highlights[0].transcript).toBe("texto-1 texto-2");
  });

  it("discards a highlight whose startSegmentId does not exist", async () => {
    const job = await run({
      segments: segments([[0, 5], [5, 10]]),
      raws: [raw({ startSegmentId: "segment_9999", endSegmentId: "segment_0002" })],
    });
    // All highlights invalid → job failed with a clear message.
    expect(job.status).toBe("failed");
    expect(job.message).toMatch(/Nenhum highlight válido/i);
    expect(job.highlights).toEqual([]);
  });

  it("rejects a highlight where endSegmentId comes before startSegmentId", async () => {
    const job = await run({
      segments: segments([[0, 5], [5, 10]]),
      raws: [raw({ startSegmentId: "segment_0002", endSegmentId: "segment_0001" })],
    });
    expect(job.status).toBe("failed");
    expect(job.message).toMatch(/Nenhum highlight válido/i);
  });

  it("filters significantly overlapping highlights (keeps the first)", async () => {
    // segment_0001[0-5], 0002[5-10], 0003[10-15], 0004[15-20]
    const segs = segments([[0, 5], [5, 10], [10, 15], [15, 20]]);
    // raw1 = [0-15], raw2 = [5-20] → overlap [5-15]=10s / shorter(15)=0.67 > 0.5
    const job = await run({
      segments: segs,
      raws: [
        raw({ startSegmentId: "segment_0001", endSegmentId: "segment_0003", title: "A" }),
        raw({ startSegmentId: "segment_0002", endSegmentId: "segment_0004", title: "B" }),
      ],
    });
    expect(job.status).toBe("completed");
    expect(job.highlights).toHaveLength(1);
    expect(job.highlights[0].title).toBe("A");
  });

  it("accepts fewer highlights than requested when the LLM returns fewer", async () => {
    const job = await run({
      segments: segments([[0, 5], [5, 10]]),
      raws: [raw()],
    });
    // numHighlights was raws.length (1) but the contract: fewer is OK.
    expect(job.status).toBe("completed");
    expect(job.highlights).toHaveLength(1);
  });

  it("marks the job failed when transcription (Deepgram) fails", async () => {
    vi.mocked(transcribeVideo).mockRejectedValue(new Error("Deepgram HTTP 500"));
    vi.mocked(selectHighlights).mockResolvedValue([]);
    vi.mocked(renderHighlightToClip).mockResolvedValue("x" as never);
    const job = createJob({ videoUrl: "https://example.com/v.mp4", aspectRatio: "9:16" });
    await runPipeline(job.id, {
      videoUrl: "https://example.com/v.mp4",
      numHighlights: 3,
      aspectRatio: "9:16",
    });
    const updated = getJob(job.id);
    expect(updated.status).toBe("failed");
    expect(updated.message).toMatch(/Deepgram HTTP 500/);
  });

  it("marks the job failed when a render fails, preserving partial results", async () => {
    const segs = segments([[0, 5], [5, 10], [10, 15]]);
    // Two disjoint ranges so both are accepted.
    const raws = [
      raw({ startSegmentId: "segment_0001", endSegmentId: "segment_0001", title: "ok" }),
      raw({ startSegmentId: "segment_0003", endSegmentId: "segment_0003", title: "boom" }),
    ];
    // First render succeeds, second fails.
    const renderImpl = vi
      .fn<unknown[], Promise<string>>()
      .mockResolvedValueOnce("https://example.com/clip-1.mp4")
      .mockRejectedValueOnce(new Error("chrome crashed"));
    const job = await run({ segments: segs, raws, renderImpl: renderImpl as never });
    expect(job.status).toBe("failed");
    expect(job.message).toMatch(/Render do clip falhou|chrome/i);
    // The first, successfully-rendered clip is preserved.
    expect(job.highlights).toHaveLength(1);
    expect(job.highlights[0].title).toBe("ok");
    expect(job.highlights[0].clipUrl).toBe("https://example.com/clip-1.mp4");
  });
});