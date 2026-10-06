import React from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";
import type { AspectRatio } from "../../lib/clipping/types";

/**
 * Vertical composition for an IAFIT clip produced by the Intelligence layer.
 *
 * Renders a TRIMMED window of the source video (startSec → endSec) inside a
 * vertical (or square / 4:5) frame with `objectFit: "cover"` (center-crop
 * reframe — V1; smart face-tracking reframe is a follow-up). A lower-third
 * overlay shows the clip title + hook for a polished short.
 *
 * Props come from the Intelligence render step (`render.ts`):
 *   { videoUrl, startSec, endSec, title?, hook?, aspectRatio?, fps? }
 *
 * Backward compat: if only `clipUrl` is provided (legacy placeholder usage),
 * it plays that pre-cut MP4 end-to-end with `objectFit: "contain"`.
 */
export interface ClipCompositionProps {
  /** Source video URL (presigned GET of the full upload). */
  videoUrl?: string;
  /** Legacy pre-cut clip URL (used when videoUrl is absent). */
  clipUrl?: string;
  startSec?: number;
  endSec?: number;
  title?: string;
  hook?: string;
  aspectRatio?: AspectRatio;
  fps?: number;
  [key: string]: unknown;
}

const FPS = 30;

export const ClipComposition: React.FC<ClipCompositionProps> = ({
  videoUrl,
  clipUrl,
  startSec = 0,
  title,
  hook,
}) => {
  // Intelligence path: trim a window of the source video.
  if (videoUrl) {
    const startFrame = Math.round(startSec * FPS);
    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <OffthreadVideo
          src={videoUrl}
          startFrom={startFrame}
          // Large source videos (e.g. a 25-min upload) can take a while to
          // fetch via Remotion's proxy; raise the delayRender timeout so the
          // render does not abort at the default 28s.
          delayRenderTimeoutInMilliseconds={120000}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {(title || hook) && (
          <AbsoluteFill
            style={{
              justifyContent: "flex-end",
              alignItems: "flex-start",
              padding: "64px 56px",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 45%)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {title && (
                <div
                  style={{
                    color: "#fff",
                    fontSize: 52,
                    fontWeight: 800,
                    fontFamily: "system-ui, sans-serif",
                    textShadow: "0 2px 12px rgba(0,0,0,0.6)",
                    lineHeight: 1.1,
                  }}
                >
                  {title}
                </div>
              )}
              {hook && (
                <div
                  style={{
                    color: "#e5e7eb",
                    fontSize: 30,
                    fontStyle: "italic",
                    fontFamily: "system-ui, sans-serif",
                    textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                    lineHeight: 1.25,
                  }}
                >
                  {hook}
                </div>
              )}
            </div>
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    );
  }

  // Legacy path: play a pre-cut clip URL.
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={clipUrl ?? ""}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </AbsoluteFill>
  );
};