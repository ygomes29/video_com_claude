"use client";

import type { AspectRatio } from "@/lib/clipping/types";

interface ClipPreviewProps {
  clipUrl: string;
  aspectRatio: AspectRatio;
  thumbnailUrl?: string;
}

/** Aspect-ratio → CSS aspect-ratio map. */
const RATIO: Record<AspectRatio, string> = {
  "9:16": "9 / 16",
  "1:1": "1 / 1",
  "4:5": "4 / 5",
};

/** Vertical / square video preview for a rendered clip. */
export function ClipPreview({ clipUrl, aspectRatio, thumbnailUrl }: ClipPreviewProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-border bg-black"
      style={{ aspectRatio: RATIO[aspectRatio] }}
    >
      <video
        src={clipUrl}
        poster={thumbnailUrl}
        controls
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-contain"
      />
    </div>
  );
}