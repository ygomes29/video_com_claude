/**
 * Transition system for IAFIT Reactivation video.
 *
 * All transition components receive `frame` as a local frame (0 = start of transition).
 * Each is wrapped in a <Sequence> in the main composition.
 *
 * Types:
 *  LightSweep      - golden diagonal beam wipes across, bridging scenes
 *  DepthBlur       - gaussian blur pulse between scenes
 *  SlideReveal     - content slides in a direction revealing next scene
 *  GlowPulse       - radial gold flash at centre
 *  MorphDissolve   - cross-dissolve with scale morph
 */

import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "./colors";
import { E, ramp } from "./utils";

// ─── helpers ─────────────────────────────────────────────────────────────────

const TRANS_DUR = 28; // default duration for all transitions

// ─── Light Sweep ─────────────────────────────────────────────────────────────
// A golden diagonal beam sweeps left→right, acting as a visual "wipe" between scenes.
export const LightSweep: React.FC<{ totalFrames?: number }> = ({ totalFrames = TRANS_DUR }) => {
  const frame = useCurrentFrame();

  // The beam centre moves from -20% to 120% of screen width
  const cx = ramp(frame, 0, totalFrames, -25, 125, E.inOut);
  const op  = ramp(frame, 0, totalFrames, 0.9, 0, E.inOut);

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 500, pointerEvents: "none",
      background: `linear-gradient(105deg,
        transparent ${cx - 18}%,
        rgba(212,175,55,0.55) ${cx - 4}%,
        rgba(246,215,107,0.85) ${cx}%,
        rgba(212,175,55,0.55) ${cx + 4}%,
        transparent ${cx + 18}%)`,
      opacity: op,
    }} />
  );
};

// ─── Depth Blur Pulse ─────────────────────────────────────────────────────────
// A black+blur overlay that pulses to full black then recedes, masking the cut.
export const DepthBlur: React.FC<{ totalFrames?: number }> = ({ totalFrames = TRANS_DUR }) => {
  const frame = useCurrentFrame();
  const half = totalFrames / 2;
  const op = frame < half
    ? ramp(frame, 0, half, 0, 1, E.inOut)
    : ramp(frame, half, half, 1, 0, E.out);

  const blurVal = frame < half
    ? ramp(frame, 0, half, 0, 14, E.inOut)
    : ramp(frame, half, half, 14, 0, E.out);

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 500, pointerEvents: "none",
      backgroundColor: C.bg,
      opacity: op * 0.92,
      backdropFilter: `blur(${blurVal}px)`,
    }} />
  );
};

// ─── Glow Pulse ───────────────────────────────────────────────────────────────
// Radial golden flash emanates from centre — great after a number reveal.
export const GlowPulse: React.FC<{ totalFrames?: number }> = ({ totalFrames = TRANS_DUR }) => {
  const frame = useCurrentFrame();
  const half  = totalFrames / 2;
  const scale = frame < half
    ? ramp(frame, 0, half, 0.3, 2.2, E.out)
    : ramp(frame, half, half, 2.2, 3.5, E.inOut);
  const op = frame < half
    ? ramp(frame, 0, half, 0, 0.55, E.out)
    : ramp(frame, half, half, 0.55, 0, E.inOut);

  return (
    <div style={{ position:"absolute", inset:0, zIndex:500, pointerEvents:"none", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{
        width: 600, height: 600, borderRadius:"50%",
        background: `radial-gradient(ellipse,rgba(212,175,55,0.45) 0%,transparent 70%)`,
        transform: `scale(${scale})`,
        opacity: op,
      }} />
    </div>
  );
};

// ─── Slide Reveal (Left) ──────────────────────────────────────────────────────
// Old content clips off to the left; a gold seam travels with it.
export const SlideReveal: React.FC<{ totalFrames?: number }> = ({ totalFrames = TRANS_DUR }) => {
  const frame = useCurrentFrame();
  const progress = ramp(frame, 0, totalFrames, 0, 1, E.inOut);
  const clipX    = `${progress * 100}%`;
  const seamX    = `${progress * 100 - 0.5}%`;
  const seamOp   = ramp(frame, 0, totalFrames, 0.8, 0, E.inOut);

  return (
    <div style={{ position:"absolute", inset:0, zIndex:500, pointerEvents:"none" }}>
      {/* Gold seam at transition edge */}
      <div style={{
        position:"absolute", top:0, bottom:0, left:seamX, width:4,
        background:`linear-gradient(180deg,transparent,${C.gold},${C.goldLight},${C.gold},transparent)`,
        opacity: seamOp,
        boxShadow:`0 0 20px 8px rgba(212,175,55,0.6)`,
      }} />
      {/* Mask: old content (left side black) */}
      <div style={{
        position:"absolute", top:0, bottom:0, left:0, width:clipX,
        background: C.bg,
      }} />
    </div>
  );
};

// ─── Morph Dissolve ────────────────────────────────────────────────────────────
// Scale+fade—used when content morphs into the next scene.
export const MorphDissolve: React.FC<{ totalFrames?: number }> = ({ totalFrames = TRANS_DUR }) => {
  const frame = useCurrentFrame();
  const half  = totalFrames / 2;
  const op = frame < half
    ? ramp(frame, 0, half, 0, 0.85, E.inOut)
    : ramp(frame, half, half, 0.85, 0, E.out);
  const sc = frame < half
    ? ramp(frame, 0, half, 1, 1.04, E.inOut)
    : ramp(frame, half, half, 0.97, 1, E.out);

  return (
    <div style={{
      position:"absolute", inset:0, zIndex:500, pointerEvents:"none",
      backgroundColor: C.bg, opacity: op,
      transform:`scale(${sc})`,
    }} />
  );
};

// ─── Cross Fade (simple opacity blend) ────────────────────────────────────────
// Exported for scene-level use: call from *within* a scene Sequence.
export function useCrossFade(frame: number, sceneDur: number, enterDur = 20, exitDur = 18) {
  const enter = ramp(frame, 0, enterDur, 0, 1);
  const exit  = ramp(frame, sceneDur - exitDur, exitDur, 1, 0, E.inOut);
  return Math.min(enter, exit);
}
