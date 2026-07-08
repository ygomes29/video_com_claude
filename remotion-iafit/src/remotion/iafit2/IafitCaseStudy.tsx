import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { NeuralBackground } from "./NeuralBackground";
import { Scene1Opening } from "./Scene1Opening";
import { Scene2Academy } from "./Scene2Academy";
import { Scene3Risk } from "./Scene3Risk";
import { Scene4WhatsApp } from "./Scene4WhatsApp";
import { Scene5Objections } from "./Scene5Objections";
import { Scene6Recovery } from "./Scene6Recovery";
import { Scene7Revenue } from "./Scene7Revenue";
import { Scene8Flow } from "./Scene8Flow";
import { Scene9Impact } from "./Scene9Impact";
import { Scene10CTA } from "./Scene10CTA";
import { colors } from "./colors";

// Timeline @ 30fps — 60 seconds = 1800 frames
// S1  Opening        0   – 150   (5s)
// S2  Academy      150  – 300   (5s)
// S3  Risk         300  – 480   (6s)
// S4  WhatsApp     480  – 660   (6s)
// S5  Objections   660  – 840   (6s)
// S6  Recovery     840  – 1020  (6s)
// S7  Revenue     1020  – 1260  (8s)
// S8  Flow        1260  – 1500  (8s)
// S9  Impact      1500  – 1650  (5s)
// S10 CTA         1650  – 1800  (5s)

const CUT_POINTS = [150, 300, 480, 660, 840, 1020, 1260, 1500, 1650];
const FADE_DUR = 12;

const BlackFlash: React.FC = () => {
  const frame = useCurrentFrame();

  let opacity = 0;
  for (const cut of CUT_POINTS) {
    const half = FADE_DUR / 2;
    const local = frame - (cut - half);
    if (local >= 0 && local < FADE_DUR) {
      const v =
        local < half
          ? local / half
          : 1 - (local - half) / half;
      opacity = Math.max(opacity, v);
    }
  }

  if (opacity === 0) return null;
  return (
    <div style={{
      position: "absolute", inset: 0,
      backgroundColor: colors.bg, opacity, zIndex: 200,
    }} />
  );
};

export const IafitCaseStudy: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <NeuralBackground />

      <Sequence from={0} durationInFrames={156}>
        <Scene1Opening />
      </Sequence>

      <Sequence from={144} durationInFrames={162}>
        <Scene2Academy />
      </Sequence>

      <Sequence from={294} durationInFrames={192}>
        <Scene3Risk />
      </Sequence>

      <Sequence from={474} durationInFrames={192}>
        <Scene4WhatsApp />
      </Sequence>

      <Sequence from={654} durationInFrames={192}>
        <Scene5Objections />
      </Sequence>

      <Sequence from={834} durationInFrames={192}>
        <Scene6Recovery />
      </Sequence>

      <Sequence from={1014} durationInFrames={252}>
        <Scene7Revenue />
      </Sequence>

      <Sequence from={1254} durationInFrames={252}>
        <Scene8Flow />
      </Sequence>

      <Sequence from={1494} durationInFrames={162}>
        <Scene9Impact />
      </Sequence>

      <Sequence from={1644} durationInFrames={156}>
        <Scene10CTA />
      </Sequence>

      <BlackFlash />
    </AbsoluteFill>
  );
};
