import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(),
}));
vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import {
  DEFAULT_OPENROUTER_MODEL,
  RawHighlightsSchema,
  requireOpenRouterKey,
  selectHighlights,
} from "../llm-select";
import type { TranscriptSegment } from "../deepgram-client";

const TRANSCRIPT: TranscriptSegment[] = [
  { id: "segment_0001", start: 0, end: 5, text: "olá" },
  { id: "segment_0002", start: 5, end: 10, text: "mundo" },
];

function providerMock() {
  const modelFn = vi.fn().mockReturnValue({ id: "model-stub" });
  return modelFn;
}

describe("llm-select — schema validation", () => {
  it("accepts a valid highlight", () => {
    const parsed = RawHighlightsSchema.parse({
      highlights: [
        {
          title: "T",
          hook: "H",
          startSegmentId: "segment_0001",
          endSegmentId: "segment_0002",
          viralScore: 80,
          iafitScore: 70,
          categories: ["DOR_DO_CLIENTE"],
          viralityReason: "r",
          iafitReason: "r2",
        },
      ],
    });
    expect(parsed.highlights).toHaveLength(1);
  });

  it("defaults categories to [] when omitted", () => {
    const parsed = RawHighlightsSchema.parse({
      highlights: [
        {
          title: "T",
          hook: "H",
          startSegmentId: "segment_0001",
          endSegmentId: "segment_0002",
          viralScore: 50,
          iafitScore: 50,
          viralityReason: "r",
          iafitReason: "r2",
        },
      ],
    });
    expect(parsed.highlights[0].categories).toEqual([]);
  });

  it("rejects viralScore > 100", () => {
    expect(() =>
      RawHighlightsSchema.parse({
        highlights: [
          {
            title: "T",
            hook: "H",
            startSegmentId: "segment_0001",
            endSegmentId: "segment_0002",
            viralScore: 150,
            iafitScore: 50,
            viralityReason: "r",
            iafitReason: "r2",
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects iafitScore < 0", () => {
    expect(() =>
      RawHighlightsSchema.parse({
        highlights: [
          {
            title: "T",
            hook: "H",
            startSegmentId: "segment_0001",
            endSegmentId: "segment_0002",
            viralScore: 50,
            iafitScore: -1,
            viralityReason: "r",
            iafitReason: "r2",
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects a category outside the allowed 7", () => {
    expect(() =>
      RawHighlightsSchema.parse({
        highlights: [
          {
            title: "T",
            hook: "H",
            startSegmentId: "segment_0001",
            endSegmentId: "segment_0002",
            viralScore: 50,
            iafitScore: 50,
            categories: ["CATEGORIA_INEXISTENTE"],
            viralityReason: "r",
            iafitReason: "r2",
          },
        ],
      }),
    ).toThrow();
  });
});

describe("llm-select — requireOpenRouterKey", () => {
  afterEach(() => delete process.env.OPENROUTER_API_KEY);

  it("throws config error when missing", () => {
    delete process.env.OPENROUTER_API_KEY;
    expect(() => requireOpenRouterKey()).toThrow(/OPENROUTER_API_KEY/);
  });
});

describe("llm-select — selectHighlights", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "or-key";
    vi.clearAllMocks();
  });
  afterEach(() => {
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_MODEL;
  });

  it("calls generateObject with the OpenRouter baseURL + default model", async () => {
    const modelFn = providerMock();
    vi.mocked(createOpenAI).mockReturnValue(modelFn as unknown as ReturnType<
      typeof createOpenAI
    >);
    vi.mocked(generateObject).mockResolvedValue({
      object: { highlights: [{ title: "T", hook: "H", startSegmentId: "segment_0001", endSegmentId: "segment_0002", viralScore: 80, iafitScore: 70, categories: [], viralityReason: "r", iafitReason: "r2" }] },
    } as unknown as Awaited<ReturnType<typeof generateObject>>);

    await selectHighlights({ transcript: TRANSCRIPT, numHighlights: 3 });

    expect(createOpenAI).toHaveBeenCalledWith({
      apiKey: "or-key",
      baseURL: "https://openrouter.ai/api/v1",
    });
    expect(modelFn).toHaveBeenCalledWith(DEFAULT_OPENROUTER_MODEL);
  });

  it("honors OPENROUTER_MODEL override", async () => {
    process.env.OPENROUTER_MODEL = "anthropic/claude-3.5-sonnet";
    const modelFn = providerMock();
    vi.mocked(createOpenAI).mockReturnValue(modelFn as unknown as ReturnType<
      typeof createOpenAI
    >);
    vi.mocked(generateObject).mockResolvedValue({
      object: { highlights: [{ title: "T", hook: "H", startSegmentId: "segment_0001", endSegmentId: "segment_0002", viralScore: 80, iafitScore: 70, categories: [], viralityReason: "r", iafitReason: "r2" }] },
    } as unknown as Awaited<ReturnType<typeof generateObject>>);

    await selectHighlights({ transcript: TRANSCRIPT, numHighlights: 2 });
    expect(modelFn).toHaveBeenCalledWith("anthropic/claude-3.5-sonnet");
  });

  it("returns the highlights from generateObject", async () => {
    const modelFn = providerMock();
    vi.mocked(createOpenAI).mockReturnValue(modelFn as unknown as ReturnType<
      typeof createOpenAI
    >);
    const highlights = [
      {
        title: "T",
        hook: "H",
        startSegmentId: "segment_0001",
        endSegmentId: "segment_0002",
        viralScore: 88,
        iafitScore: 96,
        categories: ["CASE"],
        viralityReason: "r",
        iafitReason: "r2",
      },
    ];
    vi.mocked(generateObject).mockResolvedValue({
      object: { highlights },
    } as unknown as Awaited<ReturnType<typeof generateObject>>);

    const out = await selectHighlights({ transcript: TRANSCRIPT, numHighlights: 5 });
    expect(out).toEqual(highlights);
  });

  it("passes numHighlights into the user prompt", async () => {
    const modelFn = providerMock();
    vi.mocked(createOpenAI).mockReturnValue(modelFn as unknown as ReturnType<
      typeof createOpenAI
    >);
    vi.mocked(generateObject).mockResolvedValue({
      object: { highlights: [{ title: "T", hook: "H", startSegmentId: "segment_0001", endSegmentId: "segment_0002", viralScore: 80, iafitScore: 70, categories: [], viralityReason: "r", iafitReason: "r2" }] },
    } as unknown as Awaited<ReturnType<typeof generateObject>>);

    await selectHighlights({ transcript: TRANSCRIPT, numHighlights: 7 });
    const promptArg = vi.mocked(generateObject).mock.calls[0][0] as {
      prompt: string;
    };
    expect(promptArg.prompt).toMatch(/7/);
  });

  it("retries + then throws when the model keeps returning 0 highlights", async () => {
    const modelFn = providerMock();
    vi.mocked(createOpenAI).mockReturnValue(modelFn as unknown as ReturnType<
      typeof createOpenAI
    >);
    // Non-empty transcript but the model stubbornly returns [].
    vi.mocked(generateObject).mockResolvedValue({
      object: { highlights: [] },
    } as unknown as Awaited<ReturnType<typeof generateObject>>);

    await expect(
      selectHighlights({ transcript: TRANSCRIPT, numHighlights: 3 }),
    ).rejects.toThrow(/OpenRouter falhou.*0 highlights/);
    // Retried up to 3 times.
    expect(generateObject).toHaveBeenCalledTimes(3);
    // The 2nd+ call carries the non-empty nudge.
    const retryPrompt = (vi.mocked(generateObject).mock.calls[1][0] as {
      prompt: string;
    }).prompt;
    expect(retryPrompt).toMatch(/PELO MENOS 1 highlight/);
  });

  it("wraps a generateObject failure as an upstream IntelligenceError", async () => {
    const modelFn = providerMock();
    vi.mocked(createOpenAI).mockReturnValue(modelFn as unknown as ReturnType<
      typeof createOpenAI
    >);
    vi.mocked(generateObject).mockRejectedValue(new Error("rate limited"));
    await expect(
      selectHighlights({ transcript: TRANSCRIPT, numHighlights: 3 }),
    ).rejects.toThrow(/OpenRouter falhou/);
  });

  it("throws client error for an empty transcript", async () => {
    await expect(
      selectHighlights({ transcript: [], numHighlights: 3 }),
    ).rejects.toThrow(/Transcrição vazia/);
  });
});