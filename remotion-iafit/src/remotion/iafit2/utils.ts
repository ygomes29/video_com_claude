import { interpolate, Easing } from "remotion";

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.76, 0, 0.24, 1);

export function fi(frame: number, start: number, dur = 20, from = 0, to = 1) {
  return interpolate(frame, [start, start + dur], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
}

export function fadeIn(frame: number, start: number, dur = 20) {
  return fi(frame, start, dur, 0, 1);
}

export function slideUp(frame: number, start: number, dur = 25, dist = 40) {
  return fi(frame, start, dur, dist, 0);
}

export function scaleIn(frame: number, start: number, dur = 22, from = 0.85) {
  return fi(frame, start, dur, from, 1);
}

export function countUp(frame: number, start: number, dur = 40, max = 100) {
  return Math.round(fi(frame, start, dur, 0, max, ));
}

// helper overload for countUp that accepts easing
export function countUpF(frame: number, start: number, dur = 40, max = 100) {
  return Math.round(
    interpolate(frame, [start, start + dur], [0, max], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeOut,
    }),
  );
}
