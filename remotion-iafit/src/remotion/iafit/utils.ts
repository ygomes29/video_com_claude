import { interpolate, Easing } from "remotion";

export const easeOutExpo = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOutQuart = Easing.bezier(0.76, 0, 0.24, 1);

export function fadeIn(frame: number, start: number, duration = 20) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });
}

export function fadeOut(frame: number, start: number, duration = 15) {
  return interpolate(frame, [start, start + duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOutQuart,
  });
}

export function slideUp(frame: number, start: number, duration = 25, distance = 40) {
  const t = interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });
  return (1 - t) * distance;
}

export function scaleIn(frame: number, start: number, duration = 20, from = 0.85) {
  return interpolate(frame, [start, start + duration], [from, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });
}
