import React from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";

/**
 * Base vertical composition for an IAFIT clip.
 *
 * V1 scope: just plays the clip URL inside a 9:16 (1080×1920) frame.
 * This is the FUTURE home for overlays — captions, hook, logo, CTA,
 * lower thirds, B-roll — which will be added in later phases.
 *
 * It is registered in Root.tsx for the Remotion studio and Lambda
 * rendering. The in-app "Editar no Studio" editor currently renders
 * edited clips through `DynamicComp` with a generated base-code string
 * (see clipTemplate.ts); this composition is the vertical render target
 * for when the editor supports vertical framing.
 */
export interface ClipCompositionProps {
  clipUrl?: string;
  title?: string;
  hook?: string;
  [key: string]: unknown;
}

export const ClipComposition: React.FC<ClipCompositionProps> = ({
  clipUrl = "",
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={clipUrl}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
      {/* Future overlay slots: captions, hook, logo, CTA, lower thirds */}
    </AbsoluteFill>
  );
};