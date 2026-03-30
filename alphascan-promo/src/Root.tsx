import { Composition } from "remotion";
import { AlphaScanPromo } from "./AlphaScanPromo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AlphaScanPromo"
        component={AlphaScanPromo}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};