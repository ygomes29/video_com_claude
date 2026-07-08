import React from "react";
import { Composition } from "remotion";
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
    </>
  );
};
