/**
 * IAFIT Reactivation — main composition.
 *
 * TIMELINE (1800 frames = 60s @ 30fps):
 *
 *   Scene        from    dur    ends     Transition overlay
 *   ─────────────────────────────────────────────────────
 *   S01 Opening    0    170     170      LightSweep  @ 148–180
 *   S02 Base     148    174     322      DepthBlur   @ 300–330
 *   S03 WA       300    204     504      GlowPulse   @ 482–512
 *   S04 Objects  482    244     726      MorphDissolve@704–734
 *   S05 Rate     704    234     938      SlideReveal @ 916–946
 *   S06 Revenue  916    244    1160      LightSweep  @1138–1168
 *   S07 Flow    1138    264    1402      DepthBlur   @1380–1410
 *   S08 Consol  1380    234    1614      MorphDissolve@1592–1622
 *   S09 Impact  1592    174    1766      GlowPulse   @1744–1774
 *   S10 CTA     1744    106    1850      (clamped to 1800)
 *
 * Each scene overlaps with the previous by ~22 frames so cross-fades
 * inside each scene (useCrossFade) create smooth blends, while the
 * transition overlay adds the premium visual bridge on top.
 */

import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { NeuralBg }  from "./NeuralBg";
import { S01Opening } from "./S01Opening";
import { S02Base }    from "./S02Base";
import { S03WhatsApp} from "./S03WhatsApp";
import { S04Objections } from "./S04Objections";
import { S05Rate }    from "./S05Rate";
import { S06Revenue } from "./S06Revenue";
import { S07Flow }    from "./S07Flow";
import { S08Consolidation } from "./S08Consolidation";
import { S09Impact }  from "./S09Impact";
import { S10CTA }     from "./S10CTA";
import {
  LightSweep,
  DepthBlur,
  GlowPulse,
  SlideReveal,
  MorphDissolve,
} from "./transitions";
import { C } from "./colors";

const T = 32; // transition duration in frames

export const IafitReactivation: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    {/* ── Persistent background ── */}
    <NeuralBg />

    {/* ── Scenes ── */}
    <Sequence from={0}    durationInFrames={170}><S01Opening /></Sequence>
    <Sequence from={148}  durationInFrames={174}><S02Base /></Sequence>
    <Sequence from={300}  durationInFrames={204}><S03WhatsApp /></Sequence>
    <Sequence from={482}  durationInFrames={244}><S04Objections /></Sequence>
    <Sequence from={704}  durationInFrames={234}><S05Rate /></Sequence>
    <Sequence from={916}  durationInFrames={244}><S06Revenue /></Sequence>
    <Sequence from={1138} durationInFrames={264}><S07Flow /></Sequence>
    <Sequence from={1380} durationInFrames={234}><S08Consolidation /></Sequence>
    <Sequence from={1592} durationInFrames={174}><S09Impact /></Sequence>
    <Sequence from={1744} durationInFrames={56}> <S10CTA /></Sequence>

    {/* ── Transition overlays ── */}
    {/* S01 → S02  Light Sweep: golden beam wipes right, revealing dashboard */}
    <Sequence from={148} durationInFrames={T}><LightSweep totalFrames={T} /></Sequence>

    {/* S02 → S03  Depth Blur: blur pulse masks the shift to WhatsApp */}
    <Sequence from={300} durationInFrames={T}><DepthBlur totalFrames={T} /></Sequence>

    {/* S03 → S04  Glow Pulse: gold flash as bubbles "become" cards */}
    <Sequence from={482} durationInFrames={T}><GlowPulse totalFrames={T} /></Sequence>

    {/* S04 → S05  Morph Dissolve: cards collapse into ring */}
    <Sequence from={704} durationInFrames={T}><MorphDissolve totalFrames={T} /></Sequence>

    {/* S05 → S06  Slide Reveal: 18% slides off, revenue slides in */}
    <Sequence from={916} durationInFrames={T}><SlideReveal totalFrames={T} /></Sequence>

    {/* S06 → S07  Light Sweep: beam wipes to reveal flow diagram */}
    <Sequence from={1138} durationInFrames={T}><LightSweep totalFrames={T} /></Sequence>

    {/* S07 → S08  Depth Blur: blur dissolve into consolidation */}
    <Sequence from={1380} durationInFrames={T}><DepthBlur totalFrames={T} /></Sequence>

    {/* S08 → S09  Morph Dissolve: cards dissolve into impact phrase */}
    <Sequence from={1592} durationInFrames={T}><MorphDissolve totalFrames={T} /></Sequence>

    {/* S09 → S10  Glow Pulse: gold flash as text retreats and logo expands */}
    <Sequence from={1744} durationInFrames={T}><GlowPulse totalFrames={T} /></Sequence>
  </AbsoluteFill>
);
