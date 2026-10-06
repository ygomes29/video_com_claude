import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  requireDeepgramKey,
  resolveSegmentRange,
  transcribeVideo,
  type TranscriptSegment,
} from "../deepgram-client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function deepgramOk(utterances: Array<{
  start?: number;
  end?: number;
  transcript?: string;
  speaker?: number;
}>): Response {
  return jsonResponse({ results: { utterances } });
}

const SAMPLE_SEGMENTS: TranscriptSegment[] = [
  { id: "segment_0001", start: 0, end: 5, text: "primeiro" },
  { id: "segment_0002", start: 5, end: 10, text: "segundo" },
  { id: "segment_0003", start: 10, end: 20, text: "terceiro" },
];

describe("deepgram-client — requireDeepgramKey", () => {
  afterEach(() => delete process.env.DEEPGRAM_API_KEY);

  it("throws config error when the key is missing", () => {
    delete process.env.DEEPGRAM_API_KEY;
    expect(() => requireDeepgramKey()).toThrow(/DEEPGRAM_API_KEY/);
  });

  it("returns the key when configured", () => {
    process.env.DEEPGRAM_API_KEY = "key-123";
    expect(requireDeepgramKey()).toBe("key-123");
  });
});

describe("deepgram-client — transcribeVideo", () => {
  beforeEach(() => {
    process.env.DEEPGRAM_API_KEY = "key-123";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.DEEPGRAM_API_KEY;
  });

  it("parses utterances into segments with stable IDs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () =>
        deepgramOk([
          { start: 0.4, end: 1.8, transcript: "olá", speaker: 0 },
          { start: 1.8, end: 3.2, transcript: "mundo", speaker: 1 },
        ]),
      ),
    );
    const segs = await transcribeVideo("https://example.com/v.mp4");
    expect(segs).toHaveLength(2);
    expect(segs[0].id).toBe("segment_0001");
    expect(segs[1].id).toBe("segment_0002");
    expect(segs[0].text).toBe("olá");
    expect(segs[0].speaker).toBe("0");
    expect(segs[1].start).toBe(1.8);
  });

  it("sends Authorization: Token <key> and the video url in the body", async () => {
    const fn = vi.fn().mockImplementation(async () => deepgramOk([{ transcript: "x" }]));
    vi.stubGlobal("fetch", fn);
    await transcribeVideo("https://example.com/v.mp4");
    const [url, init] = fn.mock.calls[0];
    expect(url).toMatch(/deepgram\.com\/v1\/listen/);
    expect((init.headers as Record<string, string>).Authorization).toBe("Token key-123");
    expect(JSON.parse(init.body)).toEqual({ url: "https://example.com/v.mp4" });
  });

  it("throws upstream error with a message on HTTP 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () =>
        jsonResponse({ message: "invalid api key" }, 401),
      ),
    );
    await expect(transcribeVideo("https://example.com/v.mp4")).rejects.toThrow(
      /invalid api key|HTTP 401/,
    );
  });

  it("throws upstream error on HTTP 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => jsonResponse({ error: "boom" }, 500)),
    );
    await expect(transcribeVideo("https://example.com/v.mp4")).rejects.toThrow(
      /HTTP 500/,
    );
  });

  it("throws when no utterances are returned", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => deepgramOk([])),
    );
    await expect(transcribeVideo("https://example.com/v.mp4")).rejects.toThrow(
      /no utterances|empty transcript/,
    );
  });

  it("retries on transient fetch failures", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        calls++;
        if (calls < 2) throw new Error("fetch failed: ECONNRESET");
        return deepgramOk([{ transcript: "ok" }]);
      }),
    );
    const segs = await transcribeVideo("https://example.com/v.mp4");
    expect(segs).toHaveLength(1);
    expect(calls).toBe(2);
  });
});

describe("deepgram-client — resolveSegmentRange", () => {
  it("resolves valid IDs to start/end + concatenated verbatim transcript", () => {
    const r = resolveSegmentRange(SAMPLE_SEGMENTS, "segment_0001", "segment_0003");
    expect(r).not.toBeNull();
    expect(r.startSec).toBe(0);
    expect(r.endSec).toBe(20);
    expect(r.transcript).toBe("primeiro segundo terceiro");
  });

  it("resolves a sub-range (segment_0002 → segment_0003)", () => {
    const r = resolveSegmentRange(SAMPLE_SEGMENTS, "segment_0002", "segment_0003");
    expect(r.startSec).toBe(5);
    expect(r.endSec).toBe(20);
    expect(r.transcript).toBe("segundo terceiro");
  });

  it("returns null for a non-existent startSegmentId", () => {
    expect(resolveSegmentRange(SAMPLE_SEGMENTS, "segment_9999", "segment_0003")).toBeNull();
  });

  it("returns null for a non-existent endSegmentId", () => {
    expect(resolveSegmentRange(SAMPLE_SEGMENTS, "segment_0001", "segment_9999")).toBeNull();
  });

  it("returns null when endSegmentId comes BEFORE startSegmentId", () => {
    expect(resolveSegmentRange(SAMPLE_SEGMENTS, "segment_0003", "segment_0001")).toBeNull();
  });

  it("resolves a single-segment range (start == end id)", () => {
    const r = resolveSegmentRange(SAMPLE_SEGMENTS, "segment_0002", "segment_0002");
    expect(r.startSec).toBe(5);
    expect(r.endSec).toBe(10);
    expect(r.transcript).toBe("segundo");
  });

  it("tolerates non-zero-padded ids from the LLM (segment_1 == segment_0001)", () => {
    const r = resolveSegmentRange(SAMPLE_SEGMENTS, "segment_1", "segment_3");
    expect(r).not.toBeNull();
    expect(r.startSec).toBe(0);
    expect(r.endSec).toBe(20);
    expect(r.transcript).toBe("primeiro segundo terceiro");
  });

  it("tolerates a bare numeric id from the LLM (2 == segment_0002)", () => {
    const r = resolveSegmentRange(SAMPLE_SEGMENTS, "2", "3");
    expect(r).not.toBeNull();
    expect(r.startSec).toBe(5);
    expect(r.endSec).toBe(20);
  });
});