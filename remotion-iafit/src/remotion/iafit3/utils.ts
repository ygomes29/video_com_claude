import { interpolate, Easing } from "remotion";

export const E = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.76, 0, 0.24, 1),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
};

export function ramp(frame: number, start: number, dur: number, from = 0, to = 1, ease = E.out) {
  return interpolate(frame, [start, start + dur], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
}

export const fadeIn  = (f: number, s: number, d = 18) => ramp(f, s, d, 0, 1);
export const fadeOut = (f: number, s: number, d = 14) => ramp(f, s, d, 1, 0, E.inOut);
export const up      = (f: number, s: number, d = 22, dist = 40) => ramp(f, s, d, dist, 0);
export const sc      = (f: number, s: number, d = 22, from = 0.85) => ramp(f, s, d, from, 1);
export const scOut   = (f: number, s: number, d = 14, to = 1.05) => ramp(f, s, d, 1, to, E.inOut);

export function count(frame: number, start: number, dur: number, max: number) {
  return Math.round(ramp(frame, start, dur, 0, max, E.out));
}

// Scene-level enter/exit helpers — call from within a Sequence (frame is local)
export const sceneEnter = (frame: number, dur = 20) => fadeIn(frame, 0, dur);
export const sceneExit  = (frame: number, sceneDur: number, dur = 20) =>
  fadeOut(frame, sceneDur - dur, dur);
