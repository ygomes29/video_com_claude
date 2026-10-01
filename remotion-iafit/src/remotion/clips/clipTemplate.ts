/**
 * Generates the base Remotion composition code loaded into the Motion
 * editor when a clip is sent via "Editar no Studio".
 *
 * CONSTRAINT: this code is compiled by the in-browser `compiler.ts`
 * sandbox via `new Function`, which strips imports and injects a fixed
 * whitelist of identifiers. The template below uses ONLY injected names:
 * AbsoluteFill, OffthreadVideo, useCurrentFrame, interpolate.
 *
 * V1: the editor's <Player> is 1920×1080 (16:9), so the vertical clip is
 * shown centered (pillarboxed) within that frame — ready for conversational
 * edits (captions, logo, CTA, …). The true vertical 1080×1920 composition
 * for final rendering lives in `ClipComposition.tsx` (registered in Root).
 */

import type { Clip } from "@/lib/clipping/types";

export interface ClipEditorSeed {
  code: string;
  durationInFrames: number;
  fps: number;
}

const DEFAULT_FPS = 30;
const MIN_FRAMES = 30;

/** Build a self-contained base composition string + timing for a clip. */
export function buildClipEditorSeed(clip: Clip): ClipEditorSeed {
  const fps = DEFAULT_FPS;
  const durationInSeconds =
    Number.isFinite(clip.duration) && clip.duration > 0
      ? clip.duration
      : 5;
  const durationInFrames = Math.max(
    MIN_FRAMES,
    Math.round(durationInSeconds * fps),
  );

  // JSON.stringify yields a safely-escaped JS string literal.
  const clipUrl = JSON.stringify(clip.clipUrl || "");
  const title = JSON.stringify(clip.title || "");
  const hook = JSON.stringify(clip.hook || "");

  const code = `import { AbsoluteFill, OffthreadVideo, useCurrentFrame, interpolate } from "remotion";

const CLIP_URL = ${clipUrl};
const TITLE = ${title};
const HOOK = ${hook};

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Base composition — pronto para edição conversacional */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <OffthreadVideo
          src={CLIP_URL}
          style={{ height: "100%", width: "auto", objectFit: "contain" }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{ justifyContent: "flex-start", alignItems: "flex-start", padding: 48 }}
      >
        <div style={{ color: "#fff", fontSize: 64, fontWeight: 800, opacity: fadeIn, maxWidth: "80%" }}>
          {TITLE}
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{ justifyContent: "flex-end", alignItems: "flex-start", padding: 48 }}
      >
        <div style={{ color: "#F6D76B", fontSize: 40, fontWeight: 600, opacity: fadeIn, maxWidth: "80%" }}>
          {HOOK}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
`;

  return { code, durationInFrames, fps };
}