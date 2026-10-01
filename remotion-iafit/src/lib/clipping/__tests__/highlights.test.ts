import { describe, expect, it } from "vitest";
import { normalizeShorts } from "../highlights";
import type { MuApiResultResponse, MuApiShort } from "../muapi-client";

const JOB = "req_123";

describe("normalizeShorts", () => {
  // Case: resultado vazio → [] (never throws).
  it("returns [] for an empty result", () => {
    expect(normalizeShorts({}, JOB)).toEqual([]);
    expect(normalizeShorts({ status: "completed" }, JOB)).toEqual([]);
    expect(normalizeShorts({ shorts: [] }, JOB)).toEqual([]);
  });

  it("normalizes a valid specialized shorts[] payload", () => {
    const result: MuApiResultResponse = {
      status: "completed",
      shorts: [
        {
          title: "A virada do pitch",
          start_time: 12.5,
          end_time: 45.0,
          score: 88,
          hook_sentence: "O momento que mudou tudo",
          virality_reason: "Pico emocional no relato",
          clip_url: "https://cdn.example.com/c1.mp4",
          thumbnail_url: "https://cdn.example.com/c1.jpg",
          transcript: "E foi aí que percebi...",
        },
      ],
    };

    const clips = normalizeShorts(result, JOB);
    expect(clips).toHaveLength(1);
    const c = clips[0];
    expect(c.id).toBe(`${JOB}-0`);
    expect(c.title).toBe("A virada do pitch");
    expect(c.hook).toBe("O momento que mudou tudo");
    expect(c.startTime).toBe(12.5);
    expect(c.endTime).toBe(45);
    expect(c.duration).toBe(32.5);
    expect(c.viralScore).toBe(88);
    expect(c.iafitScore).toBeNull();
    expect(c.categories).toEqual([]);
    expect(c.clipUrl).toBe("https://cdn.example.com/c1.mp4");
    expect(c.thumbnailUrl).toBe("https://cdn.example.com/c1.jpg");
    expect(c.transcript).toBe("E foi aí que percebi...");
    expect(c.status).toBe("completed");
  });

  // Case: short inválido (missing/zeroed fields) → graceful fallbacks.
  it("tolerates shorts with missing fields and falls back safely", () => {
    const result: MuApiResultResponse = {
      status: "completed",
      shorts: [{} as MuApiShort, { score: "not-a-number" } as MuApiShort],
    };

    const clips = normalizeShorts(result, JOB);
    expect(clips).toHaveLength(2);

    expect(clips[0].title).toBe("Corte 1"); // generic fallback title
    expect(clips[0].hook).toBe("");
    expect(clips[0].startTime).toBe(0);
    expect(clips[0].endTime).toBe(0);
    expect(clips[0].duration).toBe(0);
    expect(clips[0].viralScore).toBe(0);
    expect(clips[0].clipUrl).toBe("");
    expect(clips[0].transcript).toBeUndefined();
    expect(clips[0].thumbnailUrl).toBeUndefined();

    // Second short: title fallback uses index 2, score fallback for bad string.
    expect(clips[1].title).toBe("Corte 2");
    expect(clips[1].viralScore).toBe(0);
  });

  it("clamps and rounds scores to 0–100", () => {
    const result: MuApiResultResponse = {
      status: "completed",
      shorts: [
        { score: 150 } as MuApiShort,
        { score: -10 } as MuApiShort,
        { score: 87.6 } as MuApiShort,
      ],
    };
    const clips = normalizeShorts(result, JOB);
    expect(clips[0].viralScore).toBe(100);
    expect(clips[1].viralScore).toBe(0);
    expect(clips[2].viralScore).toBe(88);
  });

  it("reads from generic outputs[] (array of objects)", () => {
    const result: MuApiResultResponse = {
      status: "completed",
      outputs: [{ clip_url: "https://cdn.example.com/g.mp4", score: 42 }],
    };
    const clips = normalizeShorts(result, JOB);
    expect(clips).toHaveLength(1);
    expect(clips[0].clipUrl).toBe("https://cdn.example.com/g.mp4");
    expect(clips[0].viralScore).toBe(42);
  });

  it("reads from generic outputs[] (array of URL strings)", () => {
    const result: MuApiResultResponse = {
      status: "completed",
      outputs: ["https://cdn.example.com/a.mp4", "https://cdn.example.com/b.mp4"],
    };
    const clips = normalizeShorts(result, JOB);
    expect(clips).toHaveLength(2);
    expect(clips[0].clipUrl).toBe("https://cdn.example.com/a.mp4");
    expect(clips[1].clipUrl).toBe("https://cdn.example.com/b.mp4");
  });

  it("reads from outputs as a map containing an array value", () => {
    const result: MuApiResultResponse = {
      status: "completed",
      outputs: { shorts: [{ clip_url: "https://cdn.example.com/m.mp4" }] },
    };
    const clips = normalizeShorts(result, JOB);
    expect(clips).toHaveLength(1);
    expect(clips[0].clipUrl).toBe("https://cdn.example.com/m.mp4");
  });

  it("prefers shorts[] when both shorts and outputs are present", () => {
    const result: MuApiResultResponse = {
      status: "completed",
      shorts: [{ clip_url: "https://cdn.example.com/s.mp4" }],
      outputs: [{ clip_url: "https://cdn.example.com/o.mp4" }],
    };
    const clips = normalizeShorts(result, JOB);
    expect(clips).toHaveLength(1);
    expect(clips[0].clipUrl).toBe("https://cdn.example.com/s.mp4");
  });
});