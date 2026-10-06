import React from "react";
import { Composition } from "remotion";
import { ClipComposition } from "./clips/ClipComposition";
import { DynamicComp } from "./DynamicComp";
import { IafitVideo } from "./iafit/IafitVideo";
import { IafitCaseStudy } from "./iafit2/IafitCaseStudy";
import { IafitReactivation } from "./iafit3/IafitReactivation";

const defaultCode = `import { AbsoluteFill } from "remotion";
export const MyAnimation = () => <AbsoluteFill style={{ backgroundColor: "#000" }} />;`;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="IafitReactivation"
        component={IafitReactivation}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="IafitCaseStudy"
        component={IafitCaseStudy}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="IafitVideo"
        component={IafitVideo}
        durationInFrames={1650}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="DynamicComp"
        component={DynamicComp}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ code: defaultCode }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.durationInFrames as number,
          fps: props.fps as number,
        })}
      />
      <Composition
        id="ClipComposition"
        component={ClipComposition}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ videoUrl: "" }}
        calculateMetadata={({ props }) => {
          const fps = (props.fps as number) ?? 30;
          const startSec = (props.startSec as number) ?? 0;
          const endSec = (props.endSec as number) ?? 0;
          const ratio = (props.aspectRatio as string) ?? "9:16";
          const dims =
            ratio === "1:1"
              ? { width: 1080, height: 1080 }
              : ratio === "4:5"
                ? { width: 1080, height: 1350 }
                : { width: 1080, height: 1920 };
          const durationInFrames = Math.max(
            1,
            Math.round((endSec - startSec) * fps),
          );
          return {
            ...dims,
            durationInFrames: Number.isFinite(durationInFrames)
              ? durationInFrames
              : 300,
            fps,
          };
        }}
      />
    </>
  );
};
