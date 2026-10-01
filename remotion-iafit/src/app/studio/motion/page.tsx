"use client";

import GeneratePage from "../../generate/page";

/**
 * /studio/motion — the existing Remotion motion-graphics editor, unchanged.
 *
 * This route is a thin alias over the proven /generate page so the Content
 * Studio navigation can offer Motion as a module without rewriting or
 * duplicating the editor. The clip "Editar no Studio" flow seeds this page
 * via sessionStorage (see generate/page.tsx additive hook).
 */
export default function StudioMotionPage() {
  return <GeneratePage />;
}