import { describe, expect, it } from "vitest";
import { buildClipEditorSeed } from "../../../remotion/clips/clipTemplate";
import type { Clip } from "../types";

function makeClip(overrides: Partial<Clip> = {}): Clip {
  return {
    id: "req_1-0",
    title: "A virada do pitch",
    hook: "O momento que mudou tudo",
    startTime: 10,
    endTime: 40,
    duration: 30,
    viralScore: 88,
    iafitScore: null,
    viralityReason: "Pico emocional",
    categories: [],
    clipUrl: "https://cdn.example.com/c.mp4",
    status: "completed",
    ...overrides,
  };
}

describe("buildClipEditorSeed", () => {
  it("produces a valid EditorSeed with code + duration", () => {
    const seed = buildClipEditorSeed(makeClip());
    expect(seed.fps).toBe(30);
    expect(seed.durationInFrames).toBe(30 * 30); // duration * fps
    expect(typeof seed.code).toBe("string");
    expect(seed.code.length).toBeGreaterThan(0);
  });

  it("bakes the clip URL, title and hook into the generated code", () => {
    const seed = buildClipEditorSeed(makeClip());
    expect(seed.code).toContain("https://cdn.example.com/c.mp4");
    expect(seed.code).toContain("A virada do pitch");
    expect(seed.code).toContain("O momento que mudou tudo");
  });

  it("uses only compiler-whitelisted Remotion identifiers", () => {
    const seed = buildClipEditorSeed(makeClip());
    // The in-browser compiler strips imports and injects a fixed whitelist.
    // Any import present must be from "remotion" only, naming whitelisted ids.
    const importMatch = seed.code.match(/^import\s+([^;]+);/m);
    if (importMatch) {
      expect(importMatch[1]).toContain('"remotion"');
      for (const id of ["AbsoluteFill", "OffthreadVideo", "useCurrentFrame", "interpolate"]) {
        expect(seed.code).toContain(id);
      }
    }
    // Must NOT import from anywhere other than remotion.
    expect(seed.code).not.toMatch(/from\s+"(?!remotion)[^"]+"/);
  });

  it("guarantees a minimum frame count for very short clips", () => {
    const seed = buildClipEditorSeed(makeClip({ duration: 0.2 }));
    expect(seed.durationInFrames).toBeGreaterThanOrEqual(30);
  });
});