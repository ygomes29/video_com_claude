import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { Background } from "./Background";
import { SceneIntro } from "./SceneIntro";
import { SceneProblem } from "./SceneProblem";
import { SceneSolution } from "./SceneSolution";
import { ScenePillars } from "./ScenePillars";
import { SceneNumbers } from "./SceneNumbers";
import { SceneOffer } from "./SceneOffer";
import { SceneCTA } from "./SceneCTA";
import { colors } from "./colors";
import { easeInOutQuart } from "./utils";

// Timeline (30fps):
// 0   - 150  : Intro        (5s)
// 150 - 330  : Problem      (6s)
// 330 - 510  : Solution     (6s)
// 510 - 960  : Pillars      (15s)
// 960 - 1140 : Numbers      (6s)
// 1140- 1410 : Offer        (9s)
// 1410- 1650 : CTA          (8s)
// Total: 55s = 1650 frames

const TRANSITIONS: Array<[number, number]> = [
  [130, 150],
  [310, 330],
  [490, 510],
  [940, 960],
  [1120, 1140],
  [1390, 1410],
];

const SceneTransition: React.FC = () => {
  const frame = useCurrentFrame();

  let opacity = 0;
  for (const [start, end] of TRANSITIONS) {
    const localFrame = frame - start;
    if (localFrame >= 0 && localFrame < end - start) {
      const half = (end - start) / 2;
      if (localFrame < half) {
        opacity = Math.max(
          opacity,
          interpolate(localFrame, [0, half], [0, 1], {
            easing: easeInOutQuart,
            extrapolateRight: "clamp",
          }),
        );
      } else {
        opacity = Math.max(
          opacity,
          interpolate(localFrame, [half, end - start], [1, 0], {
            easing: easeInOutQuart,
            extrapolateRight: "clamp",
          }),
        );
      }
    }
  }

  if (opacity === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: colors.bg,
        opacity,
        zIndex: 100,
      }}
    />
  );
};

export const IafitVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      {/* Persistent background */}
      <Background />

      {/* Scene 1: Intro */}
      <Sequence from={0} durationInFrames={155}>
        <SceneIntro />
      </Sequence>

      {/* Scene 2: Problem */}
      <Sequence from={148} durationInFrames={188}>
        <SceneProblem />
      </Sequence>

      {/* Scene 3: Solution */}
      <Sequence from={328} durationInFrames={188}>
        <SceneSolution />
      </Sequence>

      {/* Scene 4: Pillars */}
      <Sequence from={508} durationInFrames={458}>
        <ScenePillars />
      </Sequence>

      {/* Scene 5: Numbers */}
      <Sequence from={958} durationInFrames={188}>
        <SceneNumbers />
      </Sequence>

      {/* Scene 6: Offer */}
      <Sequence from={1138} durationInFrames={278}>
        <SceneOffer />
      </Sequence>

      {/* Scene 7: CTA */}
      <Sequence from={1408} durationInFrames={242}>
        <SceneCTA />
      </Sequence>

      {/* Scene transitions (black flash) */}
      <SceneTransition />
    </AbsoluteFill>
  );
};
